const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  const suppliers = await Supplier.find().populate('products.product', 'name barcode').sort({ name: 1 });
  res.json({ success: true, data: suppliers });
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: supplier });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Supplier deleted' });
});

module.exports = router;
