const Bill = require('../models/Bill');
const StockMovement = require('../models/StockMovement');

/**
 * AI-powered stock prediction using rule-based analysis
 * In production, this can be enhanced with ML models
 */
const getAIPredictions = async (products) => {
  const predictions = [];

  for (const product of products) {
    // Get last 30 days sales data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesData = await Bill.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      { $group: { _id: null, totalSold: { $sum: '$items.quantity' }, orderCount: { $sum: 1 } } }
    ]);

    const totalSold = salesData[0]?.totalSold || 0;
    const dailyAvg = totalSold / 30;
    const daysOfStockLeft = dailyAvg > 0 ? Math.floor(product.stock / dailyAvg) : 999;

    // Calculate velocity trend (increasing/decreasing demand)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSales = await Bill.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } }
    ]);
    const recentDailyAvg = (recentSales[0]?.totalSold || 0) / 7;
    const trend = recentDailyAvg > dailyAvg ? 'increasing' : recentDailyAvg < dailyAvg ? 'decreasing' : 'stable';

    // Predict restock date
    const predictedRestockDate = new Date();
    predictedRestockDate.setDate(predictedRestockDate.getDate() + Math.min(daysOfStockLeft, 30));

    // Calculate suggested order quantity (2-week buffer + safety stock)
    const suggestedOrderQty = Math.ceil(dailyAvg * 14 + product.minStock);

    // Risk level
    let riskLevel = 'low';
    if (product.stock <= 0) riskLevel = 'critical';
    else if (daysOfStockLeft <= 3) riskLevel = 'high';
    else if (daysOfStockLeft <= 7) riskLevel = 'medium';

    // Confidence score (0-100)
    const confidence = Math.min(100, Math.floor((salesData[0]?.orderCount || 0) * 10));

    predictions.push({
      product: {
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
        category: product.category,
        currentStock: product.stock,
        minStock: product.minStock,
        sellingPrice: product.sellingPrice,
        status: product.status,
        image: product.image,
      },
      prediction: {
        dailyAvgSales: parseFloat(dailyAvg.toFixed(2)),
        recentDailyAvg: parseFloat(recentDailyAvg.toFixed(2)),
        trend,
        daysOfStockLeft: Math.min(daysOfStockLeft, 999),
        predictedRestockDate,
        suggestedOrderQty: Math.max(suggestedOrderQty, 0),
        riskLevel,
        confidence,
        totalSoldLast30Days: totalSold,
        insight: generateInsight(product, daysOfStockLeft, trend, dailyAvg),
      }
    });
  }

  return predictions.sort((a, b) => {
    const urgency = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgency[a.prediction.riskLevel] - urgency[b.prediction.riskLevel];
  });
};

const generateInsight = (product, daysLeft, trend, dailyAvg) => {
  if (product.stock <= 0) return `⚠️ Out of stock! Urgent reorder required for "${product.name}".`;
  if (daysLeft <= 3) return `🚨 Critical: Only ${Math.floor(daysLeft)} days of stock left. Reorder immediately.`;
  if (trend === 'increasing' && daysLeft <= 14) return `📈 Demand increasing! Stock may run out in ${Math.floor(daysLeft)} days. Consider early reorder.`;
  if (trend === 'decreasing' && dailyAvg < 1) return `📉 Slow mover. Consider promotion or discount to clear stock.`;
  if (daysLeft <= 7) return `⚠️ Low stock alert: ${Math.floor(daysLeft)} days remaining. Plan restock soon.`;
  return `✅ Stock level healthy. ${Math.floor(daysLeft)} days of inventory available.`;
};

module.exports = { getAIPredictions };
