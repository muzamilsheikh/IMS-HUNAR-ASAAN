const express = require('express');
const router = express.Router();
const {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
} = require('../controllers/expenseController');
const { authenticateToken, adminManagerOrAccountsMiddleware } = require('../middleware/auth');

router.get('/', authenticateToken, adminManagerOrAccountsMiddleware, getAllExpenses);
router.get('/:id', authenticateToken, adminManagerOrAccountsMiddleware, getExpenseById);
router.post('/', authenticateToken, adminManagerOrAccountsMiddleware, createExpense);
router.put('/:id', authenticateToken, adminManagerOrAccountsMiddleware, updateExpense);
router.delete('/:id', authenticateToken, adminManagerOrAccountsMiddleware, deleteExpense);

module.exports = router;
