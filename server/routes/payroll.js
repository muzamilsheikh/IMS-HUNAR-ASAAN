const express = require('express');
const router = express.Router();
const {
    createOrUpdatePayroll,
    getMyPayroll,
    getStaffPayroll
} = require('../controllers/payrollController');
const { authenticateToken, adminMiddleware } = require('../middleware/auth');

// Create or update payroll record (Admin only)
router.post('/', authenticateToken, adminMiddleware, createOrUpdatePayroll);

// Get logged in user's own payroll history
router.get('/my', authenticateToken, getMyPayroll);

// Get specific staff user's payroll history (Admin only)
router.get('/staff/:staffId', authenticateToken, adminMiddleware, getStaffPayroll);

module.exports = router;
