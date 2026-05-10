const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.get('/history', protect, authorize('admin'), getPaymentHistory);

module.exports = router;
