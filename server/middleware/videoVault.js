const { VideoSession, VideoAccessRequest, VideoRecording } = require('../models');
const { Op } = require('sequelize');

// Parse User-Agent to detect browser/OS
const parseUserAgent = (userAgent) => {
    const browserInfo = detectBrowser(userAgent);
    const osInfo = detectOS(userAgent);
    const deviceInfo = detectDevice(userAgent);
    
    return { browserInfo, osInfo, deviceInfo };
};

const detectBrowser = (ua) => {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Unknown';
};

const detectOS = (ua) => {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
};

const detectDevice = (ua) => {
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad')) return 'Mobile';
    return 'Desktop';
};

// Detect suspicious activity (VM, screen recorders, etc.)
const detectSuspiciousActivity = (userAgent) => {
    const suspiciousPatterns = [
        'VirtualBox', 'VMware', 'QEMU', 'KVM', // VMs
        'OBS', 'Streamlabs', 'XSplit', 'Bandicam', 'Camtasia', // Screen recorders
        'Selenium', 'Puppeteer', 'Playwright', // Automation tools
        'HeadlessChrome' // Headless browser
    ];
    
    const detected = suspiciousPatterns.filter(pattern => 
        userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return detected.length > 0 ? detected.join(', ') : null;
};

// IP Binding Middleware - Validates session IP matches current IP
const validateIPSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const currentIP = req.ip || req.connection.remoteAddress;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID required' });
        }
        
        const session = await VideoSession.findOne({
            where: {
                id: sessionId,
                isActive: true
            }
        });
        
        if (!session) {
            return res.status(403).json({ 
                error: 'Invalid or expired session',
                requiresReApproval: true
            });
        }
        
        // Check if session has expired
        if (new Date() > new Date(session.expiresAt)) {
            await session.update({ isActive: false });
            return res.status(403).json({ 
                error: 'Session expired',
                requiresReApproval: true
            });
        }
        
        // IP Binding Check
        if (session.ipAddress !== currentIP) {
            await session.update({ isActive: false });
            return res.status(403).json({ 
                error: 'IP address changed. Session paused for security.',
                requiresReApproval: true,
                previousIP: session.ipAddress,
                currentIP: currentIP
            });
        }
        
        // Update last ping
        await session.update({ lastPingAt: new Date() });
        
        req.videoSession = session;
        next();
    } catch (error) {
        console.error('IP Session validation error:', error);
        res.status(500).json({ error: 'Session validation failed' });
    }
};

// Check if student has access to recording
const checkVideoAccess = async (req, res, next) => {
    try {
        const { recordingId } = req.params;
        const studentId = req.user.id;
        
        // Check if recording exists and is approved
        const recording = await VideoRecording.findOne({
            where: {
                id: recordingId,
                status: 'Active',
                isApproved: true
            }
        });
        
        if (!recording) {
            return res.status(404).json({ error: 'Recording not found or not available' });
        }
        
        // Check if student has approved access
        const accessRequest = await VideoAccessRequest.findOne({
            where: {
                studentId,
                recordingId,
                status: 'Approved'
            },
            order: [['createdAt', 'DESC']]
        });
        
        if (!accessRequest) {
            return res.status(403).json({ 
                error: 'Access not granted. Please request access from admin.',
                requiresAccessRequest: true
            });
        }
        
        req.recording = recording;
        req.accessRequest = accessRequest;
        next();
    } catch (error) {
        console.error('Video access check error:', error);
        res.status(500).json({ error: 'Access verification failed' });
    }
};

// Security Logger Middleware
const logVideoActivity = async (req, res, next) => {
    try {
        const { VideoViewLog } = require('../models');
        const { recordingId } = req.params;
        const studentId = req.user.id;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        const { browserInfo, osInfo, deviceInfo } = parseUserAgent(userAgent);
        const suspiciousReason = detectSuspiciousActivity(userAgent);
        
        const log = await VideoViewLog.create({
            studentId,
            recordingId,
            ipAddress,
            userAgent,
            browserInfo,
            osInfo,
            deviceInfo,
            sessionStartedAt: new Date(),
            isSuspicious: !!suspiciousReason,
            suspiciousReason
        });
        
        req.videoLog = log;
        next();
    } catch (error) {
        console.error('Video activity logging error:', error);
        // Don't block the request if logging fails
        next();
    }
};

module.exports = {
    validateIPSession,
    checkVideoAccess,
    logVideoActivity,
    parseUserAgent,
    detectSuspiciousActivity
};
