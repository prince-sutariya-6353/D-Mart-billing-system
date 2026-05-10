const express = require('express');
const router = express.Router();
const {
  getProducts, getProductByBarcode, getProductById,
  addProduct, updateProduct, deleteProduct,
  updateStock, getLowStockProducts, uploadProductImage,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/low-stock', protect, getLowStockProducts);
router.get('/barcode/:code', protect, getProductByBarcode);
router.get('/', protect, getProducts);
router.post('/', protect, authorize('admin', 'staff'), uploadProductImage, addProduct);
router.get('/:id', protect, getProductById);
router.put('/:id', protect, authorize('admin', 'staff'), uploadProductImage, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id/stock', protect, authorize('admin', 'staff'), updateStock);

module.exports = router;
