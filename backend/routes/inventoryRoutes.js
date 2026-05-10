const express = require('express');
const router = express.Router();
const { getInventory, getStockMovements, getSuppliers, addSupplier, updateSupplier } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.get('/movements', protect, getStockMovements);
router.get('/suppliers', protect, getSuppliers);
router.post('/suppliers', protect, authorize('admin'), addSupplier);
router.put('/suppliers/:id', protect, authorize('admin'), updateSupplier);

module.exports = router;
