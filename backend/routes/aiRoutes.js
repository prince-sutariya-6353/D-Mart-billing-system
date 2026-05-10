const express = require('express');
const router = express.Router();
const { getStockPredictions, getBestSelling, getSlowSelling, getDemandAnalysis, getSupplierComparison, getReorderSuggestions } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/predictions', protect, authorize('admin'), getStockPredictions);
router.get('/best-selling', protect, authorize('admin'), getBestSelling);
router.get('/slow-selling', protect, authorize('admin'), getSlowSelling);
router.get('/demand', protect, authorize('admin'), getDemandAnalysis);
router.get('/supplier-comparison', protect, authorize('admin'), getSupplierComparison);
router.get('/reorder', protect, authorize('admin'), getReorderSuggestions);

module.exports = router;
