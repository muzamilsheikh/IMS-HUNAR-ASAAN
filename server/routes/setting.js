const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getSettings, updateSettings, getEmailSettings, updateEmailSettings } = require('../controllers/settingController');
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
        const ext = path.extname(file.originalname);
        cb(null, `logo_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, GIF)'));
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

router.get('/public', getSettings);
router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, adminMiddleware, upload.single('logo'), updateSettings);

router.get('/email', authenticateToken, adminMiddleware, getEmailSettings);
router.post('/email', authenticateToken, adminMiddleware, updateEmailSettings);

// ── DATABASE BACKUP & RESTORE ROUTES ──
router.get('/backup/logs', authenticateToken, adminMiddleware, getBackupHistory);
router.post('/backup/generate', authenticateToken, adminMiddleware, downloadBackupNow);
router.post('/backup/email', authenticateToken, adminMiddleware, emailBackupNow);
router.post('/backup/restore', authenticateToken, adminMiddleware, uploadBackup.single('backup'), restoreBackup);
router.get('/backup/download/:id', authenticateToken, adminMiddleware, downloadStoredBackup);

module.exports = router;
