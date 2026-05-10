const express = require('express');
const router = express.Router();
const { loginUser, getMe, registerUser, getAllStaff, updateUser, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/register', protect, authorize('admin'), registerUser);
router.get('/staff', protect, authorize('admin'), getAllStaff);
router.put('/user/:id', protect, authorize('admin'), updateUser);
router.delete('/user/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
