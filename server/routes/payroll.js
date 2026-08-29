const express = require('express');
const router = express.Router();
const {
    createOrUpdatePayroll,
    getMyPayroll,
    getStaffPayroll
} = require('../controllers/payrollController');
const { authenticateToken, adminManagerOrAccountsMiddleware } = require('../middleware/auth');

// Create or update payroll record (Admin, Manager, Accounts Manager)
router.post('/', authenticateToken, adminManagerOrAccountsMiddleware, createOrUpdatePayroll);

// Get logged in user's own payroll history
router.get('/my', authenticateToken, getMyPayroll);

// Get specific staff user's payroll history (Admin, Manager, Accounts Manager)
router.get('/staff/:staffId', authenticateToken, adminManagerOrAccountsMiddleware, getStaffPayroll);

module.exports = router;
