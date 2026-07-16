const express = require('express');
const router = express.Router();
const { authenticateToken, adminMiddleware } = require('../middleware/auth');
const { 
    validateIPSession, 
    checkVideoAccess, 
    logVideoActivity 
} = require('../middleware/videoVault');
const videoController = require('../controllers/videoVault');

// ============ PUBLIC/HEALTH CHECK ============
router.get('/health', (req, res) => {
    res.json({ status: 'Video Vault API is running', timestamp: new Date() });
});

// ============ ADMIN ROUTES (Protected + Admin Only) ============
// Get all recordings
router.get('/admin/recordings', authenticateToken, adminMiddleware, videoController.getAllRecordings);

// Create new recording
router.post('/admin/recordings', authenticateToken, adminMiddleware, videoController.createRecording);

// Update recording
router.put('/admin/recordings/:id', authenticateToken, adminMiddleware, videoController.updateRecording);

// Delete recording
router.delete('/admin/recordings/:id', authenticateToken, adminMiddleware, videoController.deleteRecording);

// Get all access requests
router.get('/admin/access-requests', authenticateToken, adminMiddleware, videoController.getAccessRequests);

// Approve access request
router.post('/admin/access-requests/:requestId/approve', authenticateToken, adminMiddleware, videoController.approveAccessRequest);

// Reject access request
router.post('/admin/access-requests/:requestId/reject', authenticateToken, adminMiddleware, videoController.rejectAccessRequest);

// Bulk approve requests
router.post('/admin/access-requests/bulk-approve', authenticateToken, adminMiddleware, videoController.bulkApproveRequests);

// Get view logs
router.get('/admin/view-logs', authenticateToken, adminMiddleware, videoController.getViewLogs);

// Get admin stats
router.get('/admin/stats', authenticateToken, adminMiddleware, videoController.getAdminStats);

// ============ STUDENT ROUTES (Protected) ============
// Get student's available recordings (My Classes)
router.get('/student/recordings', authenticateToken, videoController.getStudentRecordings);

// Request access to specific recording
router.post('/student/request-access/:recordingId', authenticateToken, videoController.requestAccess);

// Get recording details
router.get('/recordings/:recordingId', authenticateToken, checkVideoAccess, videoController.getRecordingDetails);

// Initialize streaming session
router.post('/stream/initialize/:recordingId', authenticateToken, checkVideoAccess, videoController.initializeStream);

// Stream video (Secure proxy with IP binding and logging)
router.get('/stream/:recordingId/session/:sessionId', 
    authenticateToken, 
    checkVideoAccess, 
    validateIPSession, 
    logVideoActivity, 
    videoController.streamVideo
);

// End streaming session
router.post('/stream/session/:sessionId/end', authenticateToken, videoController.endSession);

module.exports = router;
