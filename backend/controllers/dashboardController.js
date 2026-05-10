const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const User = require('../models/User');
const StockMovement = require('../models/StockMovement');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalBills, todayBills, weekBills, monthBills,
    totalProducts, lowStockProducts, outOfStockProducts,
    totalStaff, recentBills
  ] = await Promise.all([
    Bill.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Bill.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Bill.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: weekStart } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Bill.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] }, status: 'active' }),
    Product.countDocuments({ status: 'out_of_stock' }),
    User.countDocuments({ isActive: true }),
    Bill.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(10).populate('cashierId', 'name'),
  ]);

  // Sales chart data (last 7 days)
  const salesChart = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const daySales = await Bill.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: day, $lt: nextDay } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    salesChart.push({
      date: day.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: daySales[0]?.total || 0,
      orders: daySales[0]?.count || 0,
    });
  }

  // Top selling products
  const topProducts = await Bill.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  // Payment method breakdown
  const paymentBreakdown = await Bill.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } }
  ]);

  // Category sales
  const categorySales = await Bill.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $group: { _id: '$product.category', revenue: { $sum: '$items.totalPrice' } } },
    { $sort: { revenue: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalRevenue: totalBills[0]?.total || 0,
        totalOrders: totalBills[0]?.count || 0,
        todayRevenue: todayBills[0]?.total || 0,
        todayOrders: todayBills[0]?.count || 0,
        weekRevenue: weekBills[0]?.total || 0,
        weekOrders: weekBills[0]?.count || 0,
        monthRevenue: monthBills[0]?.total || 0,
        monthOrders: monthBills[0]?.count || 0,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStaff,
      },
      salesChart,
      topProducts,
      paymentBreakdown,
      categorySales,
      recentBills,
    },
  });
});

// @desc    Get monthly sales report
// @route   GET /api/dashboard/monthly
// @access  Private/Admin
const getMonthlySales = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const monthlySales = await Bill.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
    { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
    { $sort: { '_id.month': 1 } }
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = months.map((month, index) => {
    const data = monthlySales.find(s => s._id.month === index + 1);
    return { month, revenue: data?.revenue || 0, orders: data?.orders || 0 };
  });

  res.json({ success: true, data: result });
});

module.exports = { getDashboardStats, getMonthlySales };
