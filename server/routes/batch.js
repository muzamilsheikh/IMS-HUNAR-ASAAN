const express = require('express');
const router = express.Router();
const {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch
} = require('../controllers/batchController');
const { getAllSchedules } = require('../controllers/scheduleController');
const { authenticateToken, adminOrManagerMiddleware } = require('../middleware/auth');

// Get schedule grid for batches
router.get('/schedule', authenticateToken, getAllSchedules);

// Get all batches
router.get('/', authenticateToken, getAllBatches);

// Get a single batch
router.get('/:id', authenticateToken, getBatchById);

// Create a new batch
router.post('/', authenticateToken, adminOrManagerMiddleware, createBatch);

// Update a batch
router.put('/:id', authenticateToken, adminOrManagerMiddleware, updateBatch);

// Delete a batch
router.delete('/:id', authenticateToken, deleteBatch);

module.exports = router;
