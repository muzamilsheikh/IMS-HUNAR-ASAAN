const express = require('express');
const router = express.Router();
const {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');

// Get all schedules
router.get('/', authenticateToken, getAllSchedules);

// Get a single schedule
router.get('/:id', authenticateToken, getScheduleById);

// Create a new schedule
router.post('/', authenticateToken, createSchedule);

// Update a schedule
router.put('/:id', authenticateToken, updateSchedule);

// Delete a schedule
router.delete('/:id', authenticateToken, deleteSchedule);

module.exports = router;
