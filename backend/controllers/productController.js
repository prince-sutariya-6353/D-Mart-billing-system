const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage config for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadProductImage = upload.single('image');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, status, page = 1, limit = 50 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

  res.json({ success: true, count: products.length, total, data: products });
});

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:code
// @access  Private
const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ barcode: req.params.code });
  
  // Return success even if not found to avoid console error 404 during typing
  res.json({ 
    success: true, 
    found: !!product,
    data: product || null 
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product });
});

// @desc    Add product
// @route   POST /api/products
// @access  Private/Admin,Staff
const addProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = `/${req.file.path.replace(/\\/g, '/')}`;

  const barcodeExists = await Product.findOne({ barcode: data.barcode });
  if (barcodeExists) {
    res.status(400);
    throw new Error('A product with this barcode already exists');
  }

  const product = await Product.create(data);
  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin,Staff
const updateProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = `/${req.file.path.replace(/\\/g, '/')}`;

  const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Update stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin,Staff
const updateStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const stockBefore = product.stock;
  if (type === 'in') product.stock += parseInt(quantity);
  else if (type === 'out') product.stock = Math.max(0, product.stock - parseInt(quantity));
  else product.stock = parseInt(quantity);

  product.lastRestocked = type === 'in' ? new Date() : product.lastRestocked;
  await product.save();

  await StockMovement.create({
    product: product._id,
    type,
    quantity: parseInt(quantity),
    stockBefore,
    stockAfter: product.stock,
    reason: reason || 'Manual update',
    performedBy: req.user._id,
  });

  res.json({ success: true, data: product });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ['$stock', '$minStock'] },
    status: { $ne: 'inactive' },
  }).sort({ stock: 1 });
  res.json({ success: true, count: products.length, data: products });
});

module.exports = {
  getProducts, getProductByBarcode, getProductById,
  addProduct, updateProduct, deleteProduct,
  updateStock, getLowStockProducts, uploadProductImage,
};
