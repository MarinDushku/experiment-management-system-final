const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection middleware to all routes
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;