const express = require('express');
const router = express.Router();
const { getFinancialDashboardStats, getActivityLogs } = require('../controllers/statsController');
const { authenticateToken, adminMiddleware } = require('../middleware/auth');

// GET /api/stats/financial-dashboard - Professional Financial Dashboard Statistics
router.get('/financial-dashboard', authenticateToken, getFinancialDashboardStats);

// GET /api/stats/activity - System Activity Logs (Admin only)
router.get('/activity', authenticateToken, adminMiddleware, getActivityLogs);

module.exports = router;