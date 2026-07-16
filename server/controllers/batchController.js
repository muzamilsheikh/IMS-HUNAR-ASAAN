const { Batch, Course, ChatGroup } = require('../models');

// Get all batches
const getAllBatches = async (req, res) => {
    try {
        const { id, role } = req.user;
        let whereCondition = {};

        if (role === 'Staff') {
            const { CourseInstructor } = require('../models');
            const mappings = await CourseInstructor.findAll({
                where: { userId: id },
                attributes: ['courseId']
            });
            const courseIds = mappings.map(m => m.courseId);
            whereCondition = { courseId: courseIds };
        }

        const batches = await Batch.findAll({
            where: whereCondition,
            include: [
                { model: Course, attributes: ['id', 'name', 'code'] }
            ]
        });
        res.json(batches || []);
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({ error: error.message || 'Server error', batches: [] });
    }
};

// Get a single batch
const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await Batch.findByPk(id, {
            include: [
                { model: Course, attributes: ['id', 'name', 'code'] }
            ]
        });

        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        res.json(batch);
    } catch (error) {
        console.error('Get batch error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Create a new batch
const createBatch = async (req, res) => {
    try {
        const { name, time, meetingLink, driveLink, courseId, startDate, scheduleDays, startTime, endTime } = req.body;

        if (!name || !courseId) {
            return res.status(400).json({ error: 'Name and courseId are required' });
        }

        // Ensure courseId is an integer
        const parsedCourseId = parseInt(courseId);
        if (isNaN(parsedCourseId)) {
            return res.status(400).json({ error: 'courseId must be a valid integer' });
        }

        const course = await Course.findByPk(parsedCourseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        let formattedDays = '';
        if (Array.isArray(scheduleDays)) {
            formattedDays = scheduleDays.join(',');
        } else if (typeof scheduleDays === 'string') {
            formattedDays = scheduleDays;
        }

        const newBatch = await Batch.create({
            name,
            time,
            meetingLink,
            driveLink,
            courseId: parsedCourseId,
            startDate: startDate || null,
            scheduleDays: formattedDays || null,
            startTime: startTime || null,
            endTime: endTime || null
        });

        // Create a corresponding chat group for the batch
        await ChatGroup.create({
            groupName: `${name} Group`,
            batchId: newBatch.id,
            type: 'batch'
        });

        // Auto-generate recurrent schedules
        if (startDate && formattedDays && startTime && endTime) {
            const { Schedule } = require('../models');
            const dayMap = {
                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
            };
            const selectedDays = formattedDays.split(',').map(d => d.trim());
            const durationVal = course.durationValue || 1;
            const durationUnit = course.durationUnit || 'Months';

            const start = new Date(startDate);
            const end = new Date(startDate);
            if (durationUnit === 'Months') {
                end.setMonth(start.getMonth() + parseInt(durationVal));
            } else {
                end.setDate(start.getDate() + parseInt(durationVal) * 7);
            }

            let current = new Date(start);
            const schedulesToCreate = [];

            while (current <= end) {
                const dayOfWeek = current.getDay();
                const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);

                if (selectedDays.includes(dayName)) {
                    const classNumber = schedulesToCreate.length + 1;
                    schedulesToCreate.push({
                        batchId: newBatch.id,
                        topic: `Class ${classNumber}: Class Topic`,
                        date: current.toISOString().split('T')[0],
                        startTime: startTime,
                        endTime: endTime,
                        status: 'Scheduled'
                    });
                }
                current.setDate(current.getDate() + 1);
            }

            if (schedulesToCreate.length > 0) {
                await Schedule.bulkCreate(schedulesToCreate);
            }
        }

        res.status(201).json(newBatch);
    } catch (error) {
        console.error('Create batch error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Update a batch
const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, time, meetingLink, driveLink, courseId, startDate, scheduleDays, startTime, endTime } = req.body;

        const batch = await Batch.findByPk(id);
        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        let formattedDays = '';
        if (Array.isArray(scheduleDays)) {
            formattedDays = scheduleDays.join(',');
        } else if (typeof scheduleDays === 'string') {
            formattedDays = scheduleDays;
        } else if (batch.scheduleDays) {
            formattedDays = batch.scheduleDays;
        }

        const scheduleParamsChanged = 
            (startDate !== undefined && startDate !== batch.startDate) ||
            (scheduleDays !== undefined && formattedDays !== batch.scheduleDays) ||
            (startTime !== undefined && startTime !== batch.startTime) ||
            (endTime !== undefined && endTime !== batch.endTime);

        await batch.update({
            name: name || batch.name,
            time: time || batch.time,
            meetingLink: meetingLink !== undefined ? meetingLink : batch.meetingLink,
            driveLink: driveLink !== undefined ? driveLink : batch.driveLink,
            courseId: courseId || batch.courseId,
            startDate: startDate !== undefined ? startDate : batch.startDate,
            scheduleDays: startDate !== undefined ? formattedDays : batch.scheduleDays,
            startTime: startTime !== undefined ? startTime : batch.startTime,
            endTime: endTime !== undefined ? endTime : batch.endTime
        });

        if (scheduleParamsChanged) {
            // Delete existing schedules for this batch
            const { Schedule } = require('../models');
            await Schedule.destroy({ where: { batchId: batch.id } });

            // Generate new ones if configured
            const finalStartDate = startDate !== undefined ? startDate : batch.startDate;
            const finalDays = scheduleDays !== undefined ? formattedDays : batch.scheduleDays;
            const finalStartTime = startTime !== undefined ? startTime : batch.startTime;
            const finalEndTime = endTime !== undefined ? endTime : batch.endTime;

            if (finalStartDate && finalDays && finalStartTime && finalEndTime) {
                const course = await Course.findByPk(batch.courseId);
                if (course) {
                    const dayMap = {
                        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
                    };
                    const selectedDays = finalDays.split(',').map(d => d.trim());
                    const durationVal = course.durationValue || 1;
                    const durationUnit = course.durationUnit || 'Months';

                    const start = new Date(finalStartDate);
                    const end = new Date(finalStartDate);
                    if (durationUnit === 'Months') {
                        end.setMonth(start.getMonth() + parseInt(durationVal));
                    } else {
                        end.setDate(start.getDate() + parseInt(durationVal) * 7);
                    }

                    let current = new Date(start);
                    const schedulesToCreate = [];

                    while (current <= end) {
                        const dayOfWeek = current.getDay();
                        const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);

                        if (selectedDays.includes(dayName)) {
                            const classNumber = schedulesToCreate.length + 1;
                            schedulesToCreate.push({
                                batchId: batch.id,
                                topic: `Class ${classNumber}: Class Topic`,
                                date: current.toISOString().split('T')[0],
                                startTime: finalStartTime,
                                endTime: finalEndTime,
                                status: 'Scheduled'
                            });
                        }
                        current.setDate(current.getDate() + 1);
                    }

                    if (schedulesToCreate.length > 0) {
                        await Schedule.bulkCreate(schedulesToCreate);
                    }
                }
            }
        }

        res.json(batch);
    } catch (error) {
        console.error('Update batch error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Delete a batch
const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await Batch.findByPk(id);
        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        // Delete the associated chat group
        await ChatGroup.destroy({ where: { batchId: id } });

        await batch.destroy();
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch
};
