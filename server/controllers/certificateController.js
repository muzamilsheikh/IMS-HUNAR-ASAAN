const { Certificate, Student, Course, Batch, User } = require('../models');
const { sendEmail } = require('../utils/email');
const fs = require('fs');
const path = require('path');

// Folder for storing generated certificate PDFs/Images
const CERT_DIR = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * Create & Save Certificate
 */
exports.createCertificate = async (req, res) => {
    try {
        const {
            certificateNo,
            studentId,
            courseId,
            batchId,
            studentName,
            courseName,
            batchTitle,
            issueDate,
            collaborationText,
            collaborationLogo,
            goldenBadgeUrl,
            descriptionText,
            signatoryName,
            signatoryTitle,
            pdfBase64 // optional base64 data url for PDF/Image file
        } = req.body;

        if (!studentId || !studentName || !courseName || !issueDate) {
            return res.status(400).json({ message: 'Missing required certificate fields' });
        }

        // Generate unique certificateNo if not provided
        const certNum = certificateNo || `HAC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

        let savedPdfUrl = null;

        // If base64 file data provided, save to disk
        if (pdfBase64) {
            try {
                const base64Data = pdfBase64.replace(/^data:(image\/png|application\/pdf);base64,/, '');
                const ext = pdfBase64.startsWith('data:application/pdf') ? 'pdf' : 'png';
                const filename = `cert_${certNum.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${ext}`;
                const filepath = path.join(CERT_DIR, filename);

                fs.writeFileSync(filepath, base64Data, 'base64');
                savedPdfUrl = `/uploads/certificates/${filename}`;
            } catch (fileErr) {
                console.error('Failed to save certificate file to disk:', fileErr.message);
            }
        }

        const certificate = await Certificate.create({
            certificateNo: certNum,
            studentId,
            courseId: courseId || null,
            batchId: batchId || null,
            studentName,
            courseName,
            batchTitle: batchTitle || null,
            issueDate,
            collaborationText: collaborationText || null,
            collaborationLogo: collaborationLogo || null,
            goldenBadgeUrl: goldenBadgeUrl || null,
            descriptionText: descriptionText || null,
            signatoryName: signatoryName || 'Ms. Sadia K',
            signatoryTitle: signatoryTitle || 'Hunar Asaan Skills Centre',
            pdfUrl: savedPdfUrl,
            createdBy: req.user ? req.user.id : null
        });

        return res.status(201).json({
            message: 'Certificate created and saved successfully',
            certificate
        });
    } catch (err) {
        console.error('Error creating certificate:', err);
        return res.status(500).json({ message: 'Failed to create certificate', error: err.message });
    }
};

/**
 * Get all certificates for a student
 */
exports.getStudentCertificates = async (req, res) => {
    try {
        const { studentId } = req.params;

        const certificates = await Certificate.findAll({
            where: { studentId },
            include: [
                { model: Course, attributes: ['id', 'name', 'code'] },
                { model: Batch, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.json({ certificates });
    } catch (err) {
        console.error('Error fetching student certificates:', err);
        return res.status(500).json({ message: 'Failed to fetch certificates', error: err.message });
    }
};

/**
 * Get single certificate by ID
 */
exports.getCertificateById = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.findByPk(id, {
            include: [
                { model: Student, attributes: ['id', 'name', 'email', 'phone'] },
                { model: Course, attributes: ['id', 'name', 'code'] },
                { model: Batch, attributes: ['id', 'name'] }
            ]
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        return res.json({ certificate });
    } catch (err) {
        console.error('Error fetching certificate:', err);
        return res.status(500).json({ message: 'Failed to fetch certificate', error: err.message });
    }
};

/**
 * Delete a certificate
 */
exports.deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.findByPk(id);

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // Delete file if exists
        if (certificate.pdfUrl) {
            const filename = path.basename(certificate.pdfUrl);
            const filepath = path.join(CERT_DIR, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        await certificate.destroy();
        return res.json({ message: 'Certificate deleted successfully' });
    } catch (err) {
        console.error('Error deleting certificate:', err);
        return res.status(500).json({ message: 'Failed to delete certificate', error: err.message });
    }
};

/**
 * Send Certificate via Email
 */
exports.sendCertificateEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { recipientEmail, customMessage, pdfBase64 } = req.body;

        const certificate = await Certificate.findByPk(id, {
            include: [{ model: Student, attributes: ['id', 'name', 'email'] }]
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        const emailTo = recipientEmail || (certificate.Student ? certificate.Student.email : null);
        if (!emailTo) {
            return res.status(400).json({ message: 'No valid recipient email address found for this student.' });
        }

        // Prepare email attachment
        let attachments = [];
        let tempFilePath = null;

        if (pdfBase64) {
            const base64Data = pdfBase64.replace(/^data:(image\/png|application\/pdf);base64,/, '');
            const ext = pdfBase64.startsWith('data:application/pdf') ? 'pdf' : 'png';
            const filename = `Certificate_${certificate.certificateNo}.${ext}`;
            tempFilePath = path.join(CERT_DIR, `temp_${Date.now()}_${filename}`);
            fs.writeFileSync(tempFilePath, base64Data, 'base64');

            attachments.push({
                filename,
                path: tempFilePath
            });
        } else if (certificate.pdfUrl) {
            const filepath = path.join(__dirname, '..', certificate.pdfUrl);
            if (fs.existsSync(filepath)) {
                attachments.push({
                    filename: `Certificate_${certificate.certificateNo}${path.extname(filepath)}`,
                    path: filepath
                });
            }
        }

        const subject = `🎉 Congratulations on your Certificate of Completion - ${certificate.courseName}`;
        
        const htmlBody = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #0d9488;">
                    <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">Hunar Asaan Skills Centre</h1>
                    <p style="color: #0d9488; font-weight: 600; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Official Certificate Issue</p>
                </div>

                <div style="padding: 24px 0; color: #334155; line-height: 1.6;">
                    <p style="font-size: 16px; font-weight: 700; color: #0f172a;">Dear ${certificate.studentName},</p>
                    <p style="font-size: 15px;">We are delighted to congratulate you on successfully completing the <strong>${certificate.courseName}</strong> program at Hunar Asaan Skills Centre!</p>
                    
                    ${customMessage ? `<div style="background-color: #f1f5f9; padding: 16px; border-left: 4px solid #0d9488; border-radius: 8px; margin: 16px 0; font-size: 14px; font-style: italic; color: #475569;">"${customMessage}"</div>` : ''}

                    <p style="font-size: 14px; color: #64748b;">Your official certificate of completion (<strong>Certificate No: ${certificate.certificateNo}</strong>) is attached to this email.</p>
                </div>

                <div style="background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 12px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600;">Hunar Asaan Skills Centre</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Empowering Vocational & Professional Excellence</p>
                </div>
            </div>
        `;

        const result = await sendEmail(emailTo, subject, htmlBody, attachments, 'updates');

        // Cleanup temp file if created
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }

        if (result.skipped) {
            return res.json({ message: 'Email sending skipped due to SMTP settings/notification rules.', result });
        }

        return res.json({ message: `Certificate email sent successfully to ${emailTo}!`, result });
    } catch (err) {
        console.error('Error sending certificate email:', err);
        return res.status(500).json({ message: 'Failed to send certificate email', error: err.message });
    }
};
