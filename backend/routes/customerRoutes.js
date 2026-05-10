const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerByPhone, createCustomer, getCustomerHistory, updateCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'cashier', 'staff'), getCustomers);
router.post('/', protect, authorize('admin', 'cashier', 'staff'), createCustomer);
router.get('/phone/:phone', protect, authorize('admin', 'cashier', 'staff'), getCustomerByPhone);
router.get('/:id/history', protect, authorize('admin', 'cashier', 'staff'), getCustomerHistory);
router.put('/:id', protect, authorize('admin'), updateCustomer);

module.exports = router;
