const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  loyaltyPoints: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalVisits: { type: Number, default: 0 },
  purchaseHistory: [{
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
    amount: Number,
    date: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze',
  },
}, { timestamps: true });

// Auto-update tier based on totalSpent
customerSchema.pre('save', function (next) {
  if (this.totalSpent >= 100000) this.tier = 'Platinum';
  else if (this.totalSpent >= 50000) this.tier = 'Gold';
  else if (this.totalSpent >= 10000) this.tier = 'Silver';
  else this.tier = 'Bronze';
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
