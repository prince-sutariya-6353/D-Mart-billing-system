const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Bill = require('../models/Bill');

// @desc    Create Razorpay order
// @route   POST /api/payment/razorpay/order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    notes: { store: process.env.STORE_NAME },
  };

  const order = await razorpay.orders.create(options);
  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payment/razorpay/verify
// @access  Private
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed - Invalid signature');
  }

  // Update bill payment status
  if (billId) {
    await Bill.findByIdAndUpdate(billId, {
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
  }

  res.json({ success: true, message: 'Payment verified successfully', paymentId: razorpay_payment_id });
});

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private/Admin
const getPaymentHistory = asyncHandler(async (req, res) => {
  const bills = await Bill.find({ paymentStatus: 'paid' })
    .select('billNumber grandTotal paymentMethod createdAt customer')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, data: bills });
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment, getPaymentHistory };
