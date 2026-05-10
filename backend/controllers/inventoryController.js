const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Supplier = require('../models/Supplier');

// @desc    Get all inventory (products with stock info)
// @route   GET /api/inventory
// @access  Private
const getInventory = asyncHandler(async (req, res) => {
  const { category, status, search } = req.query;
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { barcode: { $regex: search, $options: 'i' } },
  ];

  const products = await Product.find(query).sort({ stock: 1 });
  res.json({ success: true, count: products.length, data: products });
});

// @desc    Get stock movements
// @route   GET /api/inventory/movements
// @access  Private
const getStockMovements = asyncHandler(async (req, res) => {
  const { productId, type, page = 1, limit = 30 } = req.query;
  const query = {};
  if (productId) query.product = productId;
  if (type) query.type = type;

  const skip = (page - 1) * limit;
  const movements = await StockMovement.find(query)
    .populate('product', 'name barcode')
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, count: movements.length, data: movements });
});

// @desc    Get all suppliers
// @route   GET /api/inventory/suppliers
// @access  Private/Admin,Staff
const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find().sort({ name: 1 });
  res.json({ success: true, data: suppliers });
});

// @desc    Add supplier
// @route   POST /api/inventory/suppliers
// @access  Private/Admin
const addSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

// @desc    Update supplier
// @route   PUT /api/inventory/suppliers/:id
// @access  Private/Admin
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!supplier) {
    res.status(404);
    throw new Error('Supplier not found');
  }
  res.json({ success: true, data: supplier });
});

module.exports = { getInventory, getStockMovements, getSuppliers, addSupplier, updateSupplier };
