const { Schedule, Batch, Course } = require('../models');

// Get all schedules (with optional filters)
const getAllSchedules = async (req, res) => {
    try {
        const { id: userId, role } = req.user;
        const { batchId, courseId, status } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (batchId) {
            whereClause.batchId = parseInt(batchId);
        }

        let allowedCourseIds = [];
        if (role === 'Staff') {
            const { CourseInstructor } = require('../models');
            const mappings = await CourseInstructor.findAll({
                where: { userId },
                attributes: ['courseId']
            });
            allowedCourseIds = mappings.map(m => m.courseId);
        }

        const includeClause = [
            {
                model: Batch,
                attributes: ['id', 'name', 'time', 'courseId'],
                where: role === 'Staff' ? { courseId: allowedCourseIds } : {},
                include: [
                    {
                        model: Course,
                        attributes: ['id', 'name', 'code']
                    }
                ]
            }
        ];

        // Apply Course filter if provided
        if (courseId) {
            const parsedCourseId = parseInt(courseId);
            if (role === 'Staff' && !allowedCourseIds.includes(parsedCourseId)) {
                return res.json({
                    success: true,
                    count: 0,
                    schedules: []
                });
            }
            includeClause[0].where = { ...includeClause[0].where, courseId: parsedCourseId };
        }

        const schedules = await Schedule.findAll({
            where: whereClause,
            include: includeClause,
            order: [
                ['date', 'ASC'],
                ['startTime', 'ASC']
            ]
        });

        res.json({
            success: true,
            count: schedules.length,
            schedules
        });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ error: error.message || 'Server error', schedules: [] });
    }
};

// Get single schedule
const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByPk(id, {
            include: [
                {
                    model: Batch,
                    attributes: ['id', 'name', 'time', 'courseId'],
                    include: [
                        {
                            model: Course,
                            attributes: ['id', 'name', 'code']
                        }
                    ]
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        res.json({
            success: true,
            schedule
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Create a new schedule
const createSchedule = async (req, res) => {
    try {
        const { batchId, topic, date, startTime, endTime, status } = req.body;

        if (!batchId || !topic || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'batchId, topic, date, startTime, and endTime are required' });
        }

        const parsedBatchId = parseInt(batchId);
        if (isNaN(parsedBatchId)) {
            return res.status(400).json({ error: 'batchId must be a valid integer' });
        }

        const newSchedule = await Schedule.create({
            batchId: parsedBatchId,
            topic,
            date,
            startTime,
            endTime,
            status: status || 'Scheduled'
        });

        // Dynamic Collaboration - Fixed Rate Per Class trigger
        if (newSchedule.status === 'Completed') {
            const { Collaboration, Expense } = require('../models');
            const { Op } = require('sequelize');

            const batch = await Batch.findByPk(newSchedule.batchId);
            if (batch) {
                const activeContract = await Collaboration.findOne({
                    where: {
                        status: 'Active',
                        payoutType: 'fixed_per_class',
                        [Op.or]: [
                            { batchId: batch.id || null },
                            { courseId: batch.courseId || null }
                        ]
                    },
                    order: [['batchId', 'DESC']]
                });

                if (activeContract) {
                    await Expense.create({
                        description: `${activeContract.partnerName} Per-Class Remuneration`,
                        amount: parseFloat(activeContract.rateValue || 0),
                        category: 'Collaboration Share',
                        date: newSchedule.date || new Date().toISOString().split('T')[0]
                    });
                }
            }
        }

        const scheduleWithDetails = await Schedule.findByPk(newSchedule.id, {
            include: [
                {
                    model: Batch,
                    attributes: ['id', 'name', 'time', 'courseId'],
                    include: [
                        {
                            model: Course,
                            attributes: ['id', 'name', 'code']
                        }
                    ]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            schedule: scheduleWithDetails
        });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Update a schedule
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { batchId, topic, date, startTime, endTime, status } = req.body;

        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const oldStatus = schedule.status;
        await schedule.update({
            batchId: batchId ? parseInt(batchId) : schedule.batchId,
            topic: topic || schedule.topic,
            date: date || schedule.date,
            startTime: startTime || schedule.startTime,
            endTime: endTime || schedule.endTime,
            status: status || schedule.status
        });

        // Dynamic Collaboration - Fixed Rate Per Class trigger
        if (status === 'Completed' && oldStatus !== 'Completed') {
            const { Collaboration, Expense } = require('../models');
            const { Op } = require('sequelize');

            const batch = await Batch.findByPk(schedule.batchId);
            if (batch) {
                const activeContract = await Collaboration.findOne({
                    where: {
                        status: 'Active',
                        payoutType: 'fixed_per_class',
                        [Op.or]: [
                            { batchId: batch.id || null },
                            { courseId: batch.courseId || null }
                        ]
                    },
                    order: [['batchId', 'DESC']]
                });

                if (activeContract) {
                    await Expense.create({
                        description: `${activeContract.partnerName} Per-Class Remuneration`,
                        amount: parseFloat(activeContract.rateValue || 0),
                        category: 'Collaboration Share',
                        date: schedule.date || new Date().toISOString().split('T')[0]
                    });
                }
            }
        }

        const scheduleWithDetails = await Schedule.findByPk(schedule.id, {
            include: [
                {
                    model: Batch,
                    attributes: ['id', 'name', 'time', 'courseId'],
                    include: [
                        {
                            model: Course,
                            attributes: ['id', 'name', 'code']
                        }
                    ]
                }
            ]
        });

        res.json({
            success: true,
            message: 'Schedule updated successfully',
            schedule: scheduleWithDetails
        });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Delete a schedule
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        await schedule.destroy();
        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
};
