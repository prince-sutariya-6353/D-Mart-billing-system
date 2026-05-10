const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const { generateInvoicePDF } = require('../services/pdfService');

const isBillOwner = (bill, user) => {
  if (!bill || !user) return false;
  return Boolean(
    (bill.customer?.email && bill.customer.email === user.email) ||
    (bill.customer?.phone && bill.customer.phone === user.phone)
  );
};

// @desc    Create new bill
// @route   POST /api/billing
// @access  Private/Cashier,Admin
const createBill = asyncHandler(async (req, res) => {
  const { items, customer, paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId, notes } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Bill must have at least one item');
  }

  let subtotal = 0, totalGST = 0, totalDiscount = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product ${item.product} not found`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
    }

    const basePrice = product.sellingPrice * item.quantity;
    const discountAmount = basePrice * (product.discountPercent / 100);
    const priceAfterDiscount = basePrice - discountAmount;
    const gstAmount = priceAfterDiscount * (product.gstPercent / 100);
    const totalPrice = priceAfterDiscount + gstAmount;

    subtotal += basePrice;
    totalDiscount += discountAmount;
    totalGST += gstAmount;

    processedItems.push({
      product: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: item.quantity,
      unit: product.unit,
      sellingPrice: product.sellingPrice,
      gstPercent: product.gstPercent,
      discountPercent: product.discountPercent,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });
  }

  const grandTotal = subtotal - totalDiscount + totalGST;

  const bill = await Bill.create({
    items: processedItems,
    customer: customer || {},
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalGST: parseFloat(totalGST.toFixed(2)),
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    paymentMethod,
    paymentStatus: paymentStatus || (paymentMethod === 'razorpay' ? 'pending' : 'paid'),
    razorpayOrderId,
    razorpayPaymentId,
    cashierId: req.user._id,
    notes,
  });

  // Deduct stock + log movements
  for (const item of processedItems) {
    const product = await Product.findById(item.product);
    const stockBefore = product.stock;
    product.stock -= item.quantity;
    product.totalSold += item.quantity;
    await product.save();

    await StockMovement.create({
      product: item.product,
      type: 'out',
      quantity: item.quantity,
      stockBefore,
      stockAfter: product.stock,
      reason: `Bill #${bill.billNumber}`,
      bill: bill._id,
      performedBy: req.user._id,
    });
  }

  // Update customer loyalty
  if (customer?.customerId) {
    const cust = await Customer.findById(customer.customerId);
    if (cust) {
      cust.totalSpent += grandTotal;
      cust.totalVisits += 1;
      cust.loyaltyPoints += Math.floor(grandTotal / 100);
      cust.purchaseHistory.push({ bill: bill._id, amount: grandTotal });
      await cust.save();
    }
  }

  // Generate PDF
  try {
    const pdfPath = await generateInvoicePDF(bill);
    await Bill.findByIdAndUpdate(bill._id, { pdfPath });
  } catch (pdfErr) {
    console.error('PDF generation error:', pdfErr.message);
  }

  const populatedBill = await Bill.findById(bill._id).populate('cashierId', 'name');
  res.status(201).json({ success: true, data: populatedBill });
});

// @desc    Get all bills
// @route   GET /api/billing
// @access  Private
const getBills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, paymentMethod, paymentStatus, startDate, endDate, search } = req.query;
  const query = {};
  const andFilters = [];

  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (search) {
    andFilters.push({
      $or: [
      { billNumber: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.phone': { $regex: search, $options: 'i' } },
      ]
    });
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  if (req.user.role === 'customer') {
    andFilters.push({
      $or: [
      { 'customer.email': req.user.email },
      { 'customer.phone': req.user.phone }
      ]
    });
    query.paymentStatus = 'paid';
  }
  if (andFilters.length) {
    query.$and = andFilters;
  }

  const skip = (page - 1) * limit;
  const total = await Bill.countDocuments(query);
  const bills = await Bill.find(query)
    .populate('cashierId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, count: bills.length, total, data: bills });
});

// @desc    Get single bill
// @route   GET /api/billing/:id
// @access  Private
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('cashierId', 'name email');
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  if (req.user.role === 'customer' && !isBillOwner(bill, req.user)) {
    res.status(403);
    throw new Error('Not authorized to access this bill');
  }
  res.json({ success: true, data: bill });
});

// @desc    Update payment status (Razorpay webhook)
// @route   PUT /api/billing/:id/payment
// @access  Private
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, razorpayPaymentId } = req.body;
  const bill = await Bill.findByIdAndUpdate(
    req.params.id,
    { paymentStatus, razorpayPaymentId },
    { new: true }
  );
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  res.json({ success: true, data: bill });
});

// @desc    Download PDF invoice
// @route   GET /api/billing/:id/pdf
// @access  Private
const downloadInvoicePDF = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('cashierId', 'name');
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  if (req.user.role === 'customer' && !isBillOwner(bill, req.user)) {
    res.status(403);
    throw new Error('Not authorized to download this invoice');
  }

  const pdfPath = await generateInvoicePDF(bill);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${bill.billNumber}.pdf"`);
  const fs = require('fs');
  const fileStream = fs.createReadStream(pdfPath);
  fileStream.pipe(res);
});

// @desc    Get logged in customer's bills
// @route   GET /api/billing/my-bills
// @access  Private (Customer)
const getMyBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find({
    $or: [
      { 'customer.email': req.user.email },
      { 'customer.phone': req.user.phone }
    ]
  }).sort({ createdAt: -1 });

  res.json({ success: true, count: bills.length, data: bills });
});

module.exports = { createBill, getBills, getBillById, updatePaymentStatus, downloadInvoicePDF, getMyBills };
