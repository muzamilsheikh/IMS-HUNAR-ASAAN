'use strict';

const express = require('express');
const router  = express.Router();
const {
    markSalaryPaid,
    getSalaryReport
} = require('../controllers/paymentController');
const { authenticateToken, adminManagerOrAccountsMiddleware } = require('../middleware/auth');

// GET /api/salaries/report?month=MM-YYYY  — admin, manager, accounts_manager
router.get('/report', authenticateToken, adminManagerOrAccountsMiddleware, getSalaryReport);

// PATCH /api/salaries/:id/pay  — mark a salary record as disbursed
router.patch('/:id/pay', authenticateToken, adminManagerOrAccountsMiddleware, markSalaryPaid);

module.exports = router;
