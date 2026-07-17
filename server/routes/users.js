const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    createUser,
    updateUserStatus,
    resetPassword,
    searchStudents,
    resetPasswordAdmin
} = require('../controllers/userController');
const { authenticateToken, adminMiddleware } = require('../middleware/auth');

// Get all users (staff + students)
router.get('/', authenticateToken, getAllUsers);

// Search active students by Name, Email, or Phone
router.get('/search', authenticateToken, searchStudents);

// Create new staff user
router.post('/', authenticateToken, adminMiddleware, createUser);

// Update user status (activate/deactivate)
router.patch('/:id/status', authenticateToken, adminMiddleware, updateUserStatus);

// Reset user password
router.patch('/reset-password/:id', authenticateToken, adminMiddleware, resetPassword);

// Master Administrative Password Reset
router.put('/:id/reset-password', authenticateToken, adminMiddleware, resetPasswordAdmin);

module.exports = router;