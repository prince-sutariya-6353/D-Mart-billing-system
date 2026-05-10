const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  barcode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'pcs' },
  sellingPrice: { type: Number, required: true },
  gstPercent: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true },
  customer: {
    name: { type: String, default: 'Walk-in Customer' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  },
  items: [billItemSchema],
  subtotal: { type: Number, required: true },
  totalGST: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'razorpay'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  pdfPath: { type: String },
}, { timestamps: true });

// Auto-generate bill number
billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    this.billNumber = `DMART-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
