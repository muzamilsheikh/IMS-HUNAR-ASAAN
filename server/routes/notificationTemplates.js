const express = require('express');
const router = express.Router();
const { authenticateToken, adminOrManagerMiddleware } = require('../middleware/auth');
const {
    getAll, getOne, create, update, remove, sendReminder
} = require('../controllers/notificationTemplateController');

// All routes require authentication
router.use(authenticateToken);

// Read — any authenticated user (staff can read templates to send reminders)
router.get('/', getAll);
router.get('/:id', getOne);

// Send reminder — any authenticated user who can view students
router.post('/send', sendReminder);

// Mutate — admin or manager only
router.post('/', adminOrManagerMiddleware, create);
router.put('/:id', adminOrManagerMiddleware, update);
router.delete('/:id', adminOrManagerMiddleware, remove);

module.exports = router;
