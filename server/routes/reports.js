const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportsController');
const { authenticateToken, adminManagerOrAccountsMiddleware } = require('../middleware/auth');

// GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=monthly|yearly|custom
router.get('/', authenticateToken, adminManagerOrAccountsMiddleware, generateReport);

module.exports = router;
