const express = require('express');
const router = express.Router();
const { getDashboardStats, getMonthlySales } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/monthly', protect, authorize('admin'), getMonthlySales);

module.exports = router;
