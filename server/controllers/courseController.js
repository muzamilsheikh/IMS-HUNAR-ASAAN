const { Course, Batch, Student, User } = require('../models');

// Get all courses
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [
                { model: Batch, attributes: ['id', 'name', 'time'] },
                { model: User, as: 'Instructors', attributes: ['id', 'name', 'email', 'specialty'] }
            ]
        });
        res.json(courses || []);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: error.message || 'Server error', courses: [] });
    }
};

// Get a single course
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findByPk(id, {
            include: [
                { model: Batch, attributes: ['id', 'name', 'time'] },
                { model: Student, attributes: ['id', 'name', 'email', 'status'] }
            ]
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Create a new course
const createCourse = async (req, res) => {
    try {
        const { name, fee, duration, code, durationValue, durationUnit, classesPerWeek, totalClasses, offerInstallments, allowed_installments } = req.body;

        if (!name || fee === undefined || !code) {
            return res.status(400).json({ error: 'Name, fee, and code are required' });
        }

        // Check if course code already exists
        const existingCourse = await Course.findOne({ where: { code } });
        if (existingCourse) {
            return res.status(409).json({ error: 'Course code already exists' });
        }

        // Compute totalClasses if not provided
        const computedTotalClasses = durationValue && classesPerWeek
            ? parseInt(durationValue) * (durationUnit === 'Months' ? 4 : 1) * parseInt(classesPerWeek)
            : null;

        const newCourse = await Course.create({
            name,
            fee: parseFloat(fee),
            duration: duration || null,
            code,
            durationValue: durationValue ? parseInt(durationValue) : null,
            durationUnit: durationUnit || 'Months',
            classesPerWeek: classesPerWeek ? parseInt(classesPerWeek) : 2,
            totalClasses: totalClasses !== undefined ? parseInt(totalClasses) : computedTotalClasses,
            offerInstallments: offerInstallments || false,
            allowed_installments: allowed_installments ? parseInt(allowed_installments) : null
        });

        res.status(201).json(newCourse);
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: error.message || 'Server error', details: error });
    }
};

// Update a course
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, fee, duration, code, durationValue, durationUnit, classesPerWeek, totalClasses, offerInstallments, allowed_installments } = req.body;

        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const currentDurationValue = durationValue !== undefined ? durationValue : course.durationValue;
        const currentDurationUnit = durationUnit !== undefined ? durationUnit : course.durationUnit;
        const currentClassesPerWeek = classesPerWeek !== undefined ? classesPerWeek : course.classesPerWeek;

        const computedTotalClasses = currentDurationValue && currentClassesPerWeek
            ? parseInt(currentDurationValue) * (currentDurationUnit === 'Months' ? 4 : 1) * parseInt(currentClassesPerWeek)
            : null;

        await course.update({
            name: name || course.name,
            fee: fee !== undefined ? parseFloat(fee) : course.fee,
            duration: duration || course.duration,
            code: code || course.code,
            durationValue: durationValue !== undefined ? parseInt(durationValue) : course.durationValue,
            durationUnit: durationUnit || course.durationUnit,
            classesPerWeek: classesPerWeek !== undefined ? parseInt(classesPerWeek) : course.classesPerWeek,
            totalClasses: totalClasses !== undefined ? parseInt(totalClasses) : computedTotalClasses,
            offerInstallments: offerInstallments !== undefined ? offerInstallments : course.offerInstallments,
            allowed_installments: allowed_installments !== undefined ? (allowed_installments ? parseInt(allowed_installments) : null) : course.allowed_installments
        });

        res.json(course);
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Delete a course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        await course.destroy();
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
};
