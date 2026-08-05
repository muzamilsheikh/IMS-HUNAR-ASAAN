const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../middleware/auth');

// Create certificate
router.post('/', authenticateToken, certificateController.createCertificate);

// Get student certificates
router.get('/student/:studentId', authenticateToken, certificateController.getStudentCertificates);

// Get single certificate
router.get('/:id', authenticateToken, certificateController.getCertificateById);

// Delete certificate
router.delete('/:id', authenticateToken, certificateController.deleteCertificate);

// Send certificate via email
router.post('/:id/send-email', authenticateToken, certificateController.sendCertificateEmail);

module.exports = router;
