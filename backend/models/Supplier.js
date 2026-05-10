const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, default: '' },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  gstin: { type: String, default: '' },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    supplyPrice: { type: Number },
    leadTimeDays: { type: Number, default: 3 },
  }],
  rating: { type: Number, default: 5, min: 1, max: 5 },
  isActive: { type: Boolean, default: true },
  totalOrders: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
