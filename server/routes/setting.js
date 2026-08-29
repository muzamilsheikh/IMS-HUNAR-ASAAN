const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getBackupHistory, downloadBackupNow, emailBackupNow, restoreBackup, downloadStoredBackup } = require('../controllers/backupController');
const { authenticateToken, adminMiddleware } = require('../middleware/auth');

// 🔥 IMPROVED: Multer config for logo uploads with settings subdirectory
const uploadsDir = path.join(__dirname, '../uploads');
const settingsDir = path.join(uploadsDir, 'settings');
const backupUploadsDir = path.join(uploadsDir, 'backups');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir, { recursive: true });
if (!fs.existsSync(backupUploadsDir)) fs.mkdirSync(backupUploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, settingsDir);  // Save directly to settings directory
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        const prefix = file.fieldname === 'signature' ? 'signature' : 'logo';
        cb(null, `${prefix}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max
    fileFilter: (req, file, cb) => {
        if (!file) return cb(null, true);
        const ext = path.extname(file.originalname).toLowerCase();
        const isImage = file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(ext);
        if (isImage) {
            return cb(null, true);
        } else {
            return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, SVG, WEBP)'));
        }
    }
});

const backupStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, backupUploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `import_${Date.now()}_${file.originalname}`);
    }
});

const uploadBackup = multer({
    storage: backupStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB database limit
});

const {
    getSettings,
    updateSettings,
    getEmailSettings,
    updateEmailSettings,
    uploadSignature
} = require('../controllers/settingController');

router.get('/public', getSettings);
router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, adminMiddleware, upload.any(), updateSettings);
router.post('/upload-signature', authenticateToken, adminMiddleware, upload.any(), uploadSignature);

router.get('/email', authenticateToken, adminMiddleware, getEmailSettings);
router.post('/email', authenticateToken, adminMiddleware, updateEmailSettings);

// ── DATABASE BACKUP & RESTORE ROUTES ──
router.get('/backup/logs', authenticateToken, adminMiddleware, getBackupHistory);
router.post('/backup/generate', authenticateToken, adminMiddleware, downloadBackupNow);
router.post('/backup/email', authenticateToken, adminMiddleware, emailBackupNow);
router.post('/backup/restore', authenticateToken, adminMiddleware, uploadBackup.single('backup'), restoreBackup);
router.get('/backup/download/:id', authenticateToken, adminMiddleware, downloadStoredBackup);

module.exports = router;
