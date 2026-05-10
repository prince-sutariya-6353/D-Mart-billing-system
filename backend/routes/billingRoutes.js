const express = require('express');
const router = express.Router();
const { 
  createBill, 
  getBills, 
  getBillById, 
  updatePaymentStatus, 
  downloadInvoicePDF, 
  getMyBills 
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POS Routes
router.post('/', protect, authorize('admin', 'cashier', 'staff'), createBill);
router.get('/', protect, authorize('admin', 'cashier', 'staff', 'customer'), getBills);

// Customer Portal Route
router.get('/my-bills', protect, authorize('customer'), getMyBills);

// Invoice Routes
router.get('/:id', protect, authorize('admin', 'cashier', 'staff', 'customer'), getBillById);
router.get('/:id/pdf', protect, authorize('admin', 'cashier', 'staff', 'customer'), downloadInvoicePDF);
router.put('/:id/payment', protect, authorize('admin', 'cashier', 'staff'), updatePaymentStatus);

module.exports = router;
