const { 
    VideoRecording, 
    VideoAccessRequest, 
    VideoViewLog, 
    VideoSession,
    Course,
    Batch,
    Student,
    User
} = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const https = require('https');
const { detectSuspiciousActivity } = require('../middleware/videoVault');

// Google Drive API configuration
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Cache for recording metadata (5 minutes TTL)
const recordingCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============ ADMIN CONTROLLERS ============

// Get all recordings (Admin)
exports.getAllRecordings = async (req, res) => {
    try {
        const { courseId, batchId, status, page = 1, limit = 20 } = req.query;
        
        const where = {};
        if (courseId) where.courseId = courseId;
        if (batchId) where.batchId = batchId;
        if (status) where.status = status;
        
        const offset = (page - 1) * limit;
        
        const { count, rows } = await VideoRecording.findAndCountAll({
            where,
            include: [
                { model: Course, attributes: ['id', 'name', 'code'] },
                { model: Batch, attributes: ['id', 'name'] },
                { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            recordings: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get all recordings error:', error);
        res.status(500).json({ error: 'Failed to fetch recordings' });
    }
};

// Create new recording (Admin)
exports.createRecording = async (req, res) => {
    try {
        const { courseId, batchId, title, description, googleDriveFileId, duration, fileSize, mimeType, thumbnailUrl } = req.body;
        
        const recording = await VideoRecording.create({
            courseId,
            batchId,
            title,
            description,
            googleDriveFileId,
            duration,
            fileSize,
            mimeType: mimeType || 'video/mp4',
            thumbnailUrl,
            uploadedBy: req.user.id,
            isApproved: true
        });
        
        res.status(201).json({ 
            message: 'Recording created successfully',
            recording 
        });
    } catch (error) {
        console.error('Create recording error:', error);
        res.status(500).json({ error: 'Failed to create recording' });
    }
};

// Update recording (Admin)
exports.updateRecording = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const recording = await VideoRecording.findByPk(id);
        if (!recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        
        await recording.update(updates);
        
        // Clear cache
        recordingCache.delete(id);
        
        res.json({ 
            message: 'Recording updated successfully',
            recording 
        });
    } catch (error) {
        console.error('Update recording error:', error);
        res.status(500).json({ error: 'Failed to update recording' });
    }
};

// Delete recording (Admin)
exports.deleteRecording = async (req, res) => {
    try {
        const { id } = req.params;
        
        const recording = await VideoRecording.findByPk(id);
        if (!recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        
        await recording.destroy();
        
        // Clear cache
        recordingCache.delete(id);
        
        res.json({ message: 'Recording deleted successfully' });
    } catch (error) {
        console.error('Delete recording error:', error);
        res.status(500).json({ error: 'Failed to delete recording' });
    }
};

// Get all access requests (Admin)
exports.getAccessRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        
        const where = {};
        if (status) where.status = status;
        
        const offset = (page - 1) * limit;
        
        const requests = await VideoAccessRequest.findAndCountAll({
            where,
            include: [
                { 
                    model: Student, 
                    attributes: ['id', 'name', 'email', 'phone', 'customId'] 
                },
                { 
                    model: VideoRecording,
                    attributes: ['id', 'title', 'duration'],
                    include: [{ model: Course, attributes: ['name'] }]
                },
                { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            requests: requests.rows,
            total: requests.count,
            page: parseInt(page),
            totalPages: Math.ceil(requests.count / limit)
        });
    } catch (error) {
        console.error('Get access requests error:', error);
        res.status(500).json({ error: 'Failed to fetch access requests' });
    }
};

// Approve access request (Admin)
exports.approveAccessRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        const request = await VideoAccessRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        await request.update({
            status: 'Approved',
            approvedBy: req.user.id,
            approvedAt: new Date()
        });
        
        // Notify student via Socket.io
        const { emitToUser } = require('../socket');
        emitToUser(request.studentId, 'video-access-approved', {
            requestId: request.id,
            recordingId: request.recordingId,
            message: 'Your video access request has been approved'
        });
        
        res.json({ message: 'Access request approved' });
    } catch (error) {
        console.error('Approve access request error:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
};

// Reject access request (Admin)
exports.rejectAccessRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        
        const request = await VideoAccessRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        await request.update({
            status: 'Rejected',
            approvedBy: req.user.id,
            approvedAt: new Date(),
            rejectionReason: reason || 'Access denied'
        });
        
        // Notify student
        const { emitToUser } = require('../socket');
        emitToUser(request.studentId, 'video-access-rejected', {
            requestId: request.id,
            recordingId: request.recordingId,
            message: 'Your video access request has been rejected',
            reason: reason || 'Access denied'
        });
        
        res.json({ message: 'Access request rejected' });
    } catch (error) {
        console.error('Reject access request error:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
};

// Bulk approve requests for a batch (Admin)
exports.bulkApproveRequests = async (req, res) => {
    try {
        const { batchId, courseId } = req.body;
        
        if (!batchId && !courseId) {
            return res.status(400).json({ error: 'batchId or courseId required' });
        }
        
        // Find all pending requests for students in the batch/course
        const where = { status: 'Pending' };
        
        if (batchId) {
            const students = await Student.findAll({ where: { batchId }, attributes: ['id'] });
            const studentIds = students.map(s => s.id);
            where.studentId = { [Op.in]: studentIds };
        }
        
        const requests = await VideoAccessRequest.findAll({ where });
        
        const updated = await VideoAccessRequest.update(
            {
                status: 'Approved',
                approvedBy: req.user.id,
                approvedAt: new Date()
            },
            { where: { id: { [Op.in]: requests.map(r => r.id) } } }
        );
        
        res.json({ 
            message: `Approved ${updated[0]} requests`,
            count: updated[0]
        });
    } catch (error) {
        console.error('Bulk approve error:', error);
        res.status(500).json({ error: 'Failed to bulk approve' });
    }
};

// Get view logs (Admin)
exports.getViewLogs = async (req, res) => {
    try {
        const { studentId, recordingId, isSuspicious, page = 1, limit = 50 } = req.query;
        
        const where = {};
        if (studentId) where.studentId = studentId;
        if (recordingId) where.recordingId = recordingId;
        if (isSuspicious === 'true') where.isSuspicious = true;
        
        const offset = (page - 1) * limit;
        
        const logs = await VideoViewLog.findAndCountAll({
            where,
            include: [
                { model: Student, attributes: ['id', 'name', 'email', 'customId'] },
                { model: VideoRecording, attributes: ['id', 'title'] }
            ],
            order: [['sessionStartedAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            logs: logs.rows,
            total: logs.count,
            page: parseInt(page),
            totalPages: Math.ceil(logs.count / limit)
        });
    } catch (error) {
        console.error('Get view logs error:', error);
        res.status(500).json({ error: 'Failed to fetch view logs' });
    }
};

// ============ STUDENT CONTROLLERS ============

// Get student's available recordings (My Classes)
exports.getStudentRecordings = async (req, res) => {
    try {
        const studentId = req.user.id;
        const cacheKey = `student_${studentId}_recordings`;
        
        // Check cache
        if (recordingCache.has(cacheKey)) {
            const cached = recordingCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return res.json(cached.data);
            }
            recordingCache.delete(cacheKey);
        }
        
        // Get student's course/batch
        const student = await Student.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const where = {
            status: 'Active',
            isApproved: true,
            [Op.or]: [
                { courseId: student.courseId },
                { batchId: student.batchId }
            ]
        };
        
        const recordings = await VideoRecording.findAll({
            where,
            include: [
                { model: Course, attributes: ['id', 'name', 'code'] },
                { model: Batch, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        const result = {
            recordings,
            count: recordings.length
        };
        
        // Cache the result
        recordingCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json(result);
    } catch (error) {
        console.error('Get student recordings error:', error);
        res.status(500).json({ error: 'Failed to fetch recordings' });
    }
};

// Request access to recording
exports.requestAccess = async (req, res) => {
    try {
        const { recordingId } = req.params;
        const studentId = req.user.id;
        
        // Check if already requested
        const existing = await VideoAccessRequest.findOne({
            where: {
                studentId,
                recordingId,
                status: { [Op.in]: ['Pending', 'Approved'] }
            }
        });
        
        if (existing) {
            return res.status(400).json({ 
                error: existing.status === 'Approved' 
                    ? 'You already have access to this recording'
                    : 'Access request is already pending'
            });
        }
        
        const request = await VideoAccessRequest.create({
            studentId,
            recordingId
        });
        
        // Notify admins via Socket.io
        const { emitToAll } = require('../socket');
        emitToAll('video-access-request', {
            requestId: request.id,
            studentId,
            recordingId,
            message: 'New video access request'
        });
        
        res.status(201).json({ 
            message: 'Access request sent to admin',
            request 
        });
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({ error: 'Failed to request access' });
    }
};

// Initialize video streaming session
exports.initializeStream = async (req, res) => {
    try {
        const { recordingId } = req.params;
        const studentId = req.user.id;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        // Create secure session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        
        const session = await VideoSession.create({
            studentId,
            recordingId,
            ipAddress,
            sessionToken,
            expiresAt
        });
        
        // Increment view count
        await VideoRecording.increment('viewCount', { where: { id: recordingId } });
        
        res.json({
            message: 'Stream session initialized',
            sessionId: session.id,
            sessionToken,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        console.error('Initialize stream error:', error);
        res.status(500).json({ error: 'Failed to initialize stream' });
    }
};

// Stream video (Secure proxy - browser never sees Google Drive URL)
exports.streamVideo = async (req, res) => {
    try {
        const { recordingId } = req.params;
        
        const recording = await VideoRecording.findByPk(recordingId);
        if (!recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        
        // Construct Google Drive video URL
        const videoUrl = `https://www.googleapis.com/drive/v3/files/${recording.googleDriveFileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
        
        // Set appropriate headers
        res.setHeader('Content-Type', recording.mimeType || 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Forward range requests to Google Drive
        if (req.headers.range) {
            res.setHeader('Range', req.headers.range);
        }
        
        // Stream the video through our server (secure bridge)
        const request = https.get(videoUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN || ''}`
            }
        }, (googleRes) => {
            // Forward status and headers
            res.status(googleRes.statusCode);
            
            if (googleRes.headers['content-range']) {
                res.setHeader('Content-Range', googleRes.headers['content-range']);
            }
            if (googleRes.headers['content-length']) {
                res.setHeader('Content-Length', googleRes.headers['content-length']);
            }
            
            // Pipe the stream (memory-efficient)
            googleRes.pipe(res);
        });
        
        request.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to stream video' });
            }
        });
        
    } catch (error) {
        console.error('Stream video error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream video' });
        }
    }
};

// End video session
exports.endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { watchDuration } = req.body;
        
        const session = await VideoSession.findByPk(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await session.update({
            isActive: false,
            lastPingAt: new Date()
        });
        
        // Update view log
        if (req.videoLog) {
            await req.videoLog.update({
                sessionEndedAt: new Date(),
                watchDuration: watchDuration || 0
            });
        }
        
        res.json({ message: 'Session ended' });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
};

// Get recording details (with access check)
exports.getRecordingDetails = async (req, res) => {
    try {
        const { recordingId } = req.params;
        
        const cacheKey = `recording_${recordingId}`;
        
        if (recordingCache.has(cacheKey)) {
            const cached = recordingCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return res.json(cached.data);
            }
            recordingCache.delete(cacheKey);
        }
        
        const recording = await VideoRecording.findByPk(recordingId, {
            include: [
                { model: Course, attributes: ['id', 'name', 'code'] },
                { model: Batch, attributes: ['id', 'name'] }
            ]
        });
        
        if (!recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        
        const result = { recording };
        
        recordingCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json(result);
    } catch (error) {
        console.error('Get recording details error:', error);
        res.status(500).json({ error: 'Failed to fetch recording details' });
    }
};

// Get admin dashboard stats
exports.getAdminStats = async (req, res) => {
    try {
        const totalRecordings = await VideoRecording.count();
        const pendingRequests = await VideoAccessRequest.count({ where: { status: 'Pending' } });
        const totalViews = await VideoViewLog.count();
        const suspiciousActivities = await VideoViewLog.count({ where: { isSuspicious: true } });
        const activeSessions = await VideoSession.count({ where: { isActive: true } });
        
        res.json({
            totalRecordings,
            pendingRequests,
            totalViews,
            suspiciousActivities,
            activeSessions
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};