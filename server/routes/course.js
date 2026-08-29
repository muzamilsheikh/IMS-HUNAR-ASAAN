const express = require('express');
const router = express.Router();
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courseController');
const { authenticateToken, adminOrManagerMiddleware } = require('../middleware/auth');

// Get all courses
router.get('/', authenticateToken, getAllCourses);

// Get a single course
router.get('/:id', authenticateToken, getCourseById);

// Create a new course
router.post('/', authenticateToken, adminOrManagerMiddleware, createCourse);

// Update a course
router.put('/:id', authenticateToken, adminOrManagerMiddleware, updateCourse);

// Delete a course
router.delete('/:id', authenticateToken, adminOrManagerMiddleware, deleteCourse);

module.exports = router;