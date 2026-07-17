const express = require('express');
const router = express.Router();
const { Collaboration, Course, Batch } = require('../models');
const { authenticateToken, adminManagerOrAccountsMiddleware } = require('../middleware/auth');

// GET all collaborations
router.get('/', authenticateToken, adminManagerOrAccountsMiddleware, async (req, res) => {
    try {
        const collabs = await Collaboration.findAll({
            include: [
                { model: Course, attributes: ['name'] },
                { model: Batch, attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(collabs);
    } catch (error) {
        console.error('Fetch collaborations error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

// POST new collaboration
router.post('/', authenticateToken, adminManagerOrAccountsMiddleware, async (req, res) => {
    try {
        const { partnerName, courseId, batchId, payoutType, rateValue, status } = req.body;
        if (!partnerName || rateValue === undefined || !payoutType) {
            return res.status(400).json({ error: 'Partner name, payout type, and rate value are required' });
        }

        const newCollab = await Collaboration.create({
            partnerName: partnerName.trim(),
            courseId: courseId ? parseInt(courseId, 10) : null,
            batchId: batchId ? parseInt(batchId, 10) : null,
            payoutType,
            rateValue: parseFloat(rateValue) || 0,
            status: status || 'Active'
        });

        const populated = await Collaboration.findByPk(newCollab.id, {
            include: [
                { model: Course, attributes: ['name'] },
                { model: Batch, attributes: ['name'] }
            ]
        });

        res.status(201).json(populated);
    } catch (error) {
        console.error('Create collaboration error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

// PUT update collaboration
router.put('/:id', authenticateToken, adminManagerOrAccountsMiddleware, async (req, res) => {
    try {
        const { partnerName, courseId, batchId, payoutType, rateValue, status } = req.body;
        const collab = await Collaboration.findByPk(req.params.id);
        if (!collab) {
            return res.status(404).json({ error: 'Collaboration contract not found' });
        }

        await collab.update({
            partnerName: partnerName !== undefined ? partnerName.trim() : collab.partnerName,
            courseId: courseId !== undefined ? (courseId ? parseInt(courseId, 10) : null) : collab.courseId,
            batchId: batchId !== undefined ? (batchId ? parseInt(batchId, 10) : null) : collab.batchId,
            payoutType: payoutType !== undefined ? payoutType : collab.payoutType,
            rateValue: rateValue !== undefined ? parseFloat(rateValue) : collab.rateValue,
            status: status !== undefined ? status : collab.status
        });

        const populated = await Collaboration.findByPk(collab.id, {
            include: [
                { model: Course, attributes: ['name'] },
                { model: Batch, attributes: ['name'] }
            ]
        });

        res.json(populated);
    } catch (error) {
        console.error('Update collaboration error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

// DELETE collaboration
router.delete('/:id', authenticateToken, adminManagerOrAccountsMiddleware, async (req, res) => {
    try {
        const collab = await Collaboration.findByPk(req.params.id);
        if (!collab) {
            return res.status(404).json({ error: 'Collaboration contract not found' });
        }
        await collab.destroy();
        res.json({ message: 'Collaboration contract deleted successfully' });
    } catch (error) {
        console.error('Delete collaboration error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

module.exports = router;
