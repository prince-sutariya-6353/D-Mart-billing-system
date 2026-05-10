const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
  const { search, tier, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (tier) query.tier = tier;

  const skip = (page - 1) * limit;
  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query).sort({ totalSpent: -1 }).skip(skip).limit(parseInt(limit));

  res.json({ success: true, count: customers.length, total, data: customers });
});

// @desc    Get customer by phone
// @route   GET /api/customers/phone/:phone
// @access  Private
const getCustomerByPhone = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ phone: req.params.phone });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  res.json({ success: true, data: customer });
});

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address } = req.body;
  const exists = await Customer.findOne({ phone });
  if (exists) {
    return res.json({ success: true, data: exists, message: 'Existing customer found' });
  }
  const customer = await Customer.create({ name, phone, email, address });
  res.status(201).json({ success: true, data: customer });
});

// @desc    Get customer purchase history
// @route   GET /api/customers/:id/history
// @access  Private
const getCustomerHistory = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  const bills = await Bill.find({ 'customer.customerId': req.params.id, paymentStatus: 'paid' })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ success: true, data: { customer, bills } });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  res.json({ success: true, data: customer });
});

module.exports = { getCustomers, getCustomerByPhone, createCustomer, getCustomerHistory, updateCustomer };
