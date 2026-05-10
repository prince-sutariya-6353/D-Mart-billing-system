const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  barcode: { type: String, required: true, unique: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Groceries', 'Dairy', 'Beverages', 'Snacks', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Bakery', 'Frozen Foods', 'Electronics', 'Other'],
  },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  gstPercent: { type: Number, default: 0, min: 0, max: 28 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  minStock: { type: Number, default: 10 },
  unit: { type: String, default: 'pcs', enum: ['pcs', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'box'] },
  supplier: {
    name: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  expiryDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
  },
  totalSold: { type: Number, default: 0 },
  lastRestocked: { type: Date },
}, { timestamps: true });

// Auto-update status based on stock
productSchema.pre('save', function (next) {
  if (this.stock <= 0) this.status = 'out_of_stock';
  else if (this.status === 'out_of_stock') this.status = 'active';
  next();
});

// Virtual: effective selling price after GST and discount
productSchema.virtual('effectivePrice').get(function () {
  const priceWithGST = this.sellingPrice * (1 + this.gstPercent / 100);
  const finalPrice = priceWithGST * (1 - this.discountPercent / 100);
  return parseFloat(finalPrice.toFixed(2));
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
