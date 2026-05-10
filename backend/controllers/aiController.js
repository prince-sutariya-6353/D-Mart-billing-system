const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const StockMovement = require('../models/StockMovement');
const { getAIPredictions } = require('../services/aiService');
const { compareSuppliers } = require('../services/anakinService');

// @desc    Get stock predictions
// @route   GET /api/ai/predictions
// @access  Private/Admin
const getStockPredictions = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $ne: 'inactive' } });
  const predictions = await getAIPredictions(products);
  res.json({ success: true, data: predictions });
});

// @desc    Get best selling products
// @route   GET /api/ai/best-selling
// @access  Private/Admin
const getBestSelling = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const results = await Bill.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    { $group: {
      _id: '$items.product',
      name: { $first: '$items.name' },
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.totalPrice' },
      orderCount: { $sum: 1 },
    }},
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);

  res.json({ success: true, data: results });
});

// @desc    Get slow selling products
// @route   GET /api/ai/slow-selling
// @access  Private/Admin
const getSlowSelling = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const allProducts = await Product.find({ status: 'active' }).select('_id name category stock sellingPrice');

  const soldProducts = await Bill.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', totalQuantity: { $sum: '$items.quantity' } } }
  ]);

  const soldMap = {};
  soldProducts.forEach(p => { soldMap[p._id.toString()] = p.totalQuantity; });

  const slowSelling = allProducts
    .map(p => ({ ...p.toJSON(), soldInPeriod: soldMap[p._id.toString()] || 0 }))
    .filter(p => p.soldInPeriod < 5)
    .sort((a, b) => a.soldInPeriod - b.soldInPeriod)
    .slice(0, 10);

  res.json({ success: true, data: slowSelling });
});

// @desc    Get demand analysis
// @route   GET /api/ai/demand
// @access  Private/Admin
const getDemandAnalysis = asyncHandler(async (req, res) => {
  const movements = await StockMovement.aggregate([
    { $match: { type: 'out' } },
    { $group: { _id: { product: '$product', dayOfWeek: { $dayOfWeek: '$createdAt' } }, avgQty: { $avg: '$quantity' } } },
    { $group: { _id: '$_id.product', demandPattern: { $push: { day: '$_id.dayOfWeek', avg: '$avgQty' } } } },
    { $limit: 20 }
  ]);

  res.json({ success: true, data: movements });
});

// @desc    Get supplier comparison via Anakin API
// @route   GET /api/ai/supplier-comparison
// @access  Private/Admin
const getSupplierComparison = asyncHandler(async (req, res) => {
  const { productName } = req.query;
  if (!productName) {
    res.status(400);
    throw new Error('productName query parameter is required');
  }
  const comparison = await compareSuppliers(productName);
  res.json({ success: true, data: comparison });
});

// @desc    Get reorder suggestions
// @route   GET /api/ai/reorder
// @access  Private/Admin
const getReorderSuggestions = asyncHandler(async (req, res) => {
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$minStock'] },
    status: { $ne: 'inactive' },
  });

  const suggestions = await Promise.all(lowStockProducts.map(async (product) => {
    const avgSales = await Bill.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } }
    ]);

    const monthlySales = avgSales[0]?.totalSold || 0;
    const dailyAvg = monthlySales / 30;
    const reorderQty = Math.ceil(dailyAvg * 14); // 2-week supply

    return {
      product: { _id: product._id, name: product.name, barcode: product.barcode, category: product.category },
      currentStock: product.stock,
      minStock: product.minStock,
      dailyAvgSales: dailyAvg.toFixed(2),
      suggestedReorderQty: Math.max(reorderQty, product.minStock * 2),
      urgency: product.stock === 0 ? 'critical' : product.stock <= product.minStock / 2 ? 'high' : 'medium',
      supplier: product.supplier,
    };
  }));

  res.json({ success: true, data: suggestions });
});

module.exports = { getStockPredictions, getBestSelling, getSlowSelling, getDemandAnalysis, getSupplierComparison, getReorderSuggestions };
