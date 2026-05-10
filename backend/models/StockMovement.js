const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'return'],
    required: true,
  },
  quantity: { type: Number, required: true },
  stockBefore: { type: Number, required: true },
  stockAfter: { type: Number, required: true },
  reason: { type: String, default: '' },
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
