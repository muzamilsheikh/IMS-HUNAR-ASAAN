const nodemailer = require('nodemailer');
const { Setting, User } = require('../models');
const path = require('path');
const fs = require('fs');

// Load configurations dynamically from Settings table
const getSMTPConfig = async () => {
    try {
        const setting = await Setting.findOne();
        if (setting) {
            return {
                host: setting.emailHost || process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(setting.emailPort || process.env.SMTP_PORT || '587', 10),
                user: setting.emailUser || process.env.SMTP_USER,
                pass: setting.emailPass || process.env.SMTP_PASS,
                notificationsEnabled: setting.emailNotificationsEnabled !== false // default to true
            };
        }
    } catch (err) {
        console.error('Failed to load SMTP settings from database:', err.message);
    }
    return {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        notificationsEnabled: true
    };
};

// Send single email function with inline logo integration and arbitrary attachments
const sendEmail = async (to, subject, htmlContent, attachments = []) => {
    try {
        const config = await getSMTPConfig();
        const setting = await Setting.findOne();
        
        // Skip sending if notifications are globally disabled
        if (!config.notificationsEnabled) {
            console.log(`✉️ Email notifications globally disabled. Skipped sending to: ${to}`);
            return { success: true, skipped: true };
        }

        if (!config.user || !config.pass) {
            console.warn('⚠️ SMTP credentials not configured in DB or env. Skipped sending email.');
            return { success: false, error: 'SMTP credentials missing' };
        }

        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465, // true for 465, false for 587 etc.
            auth: {
                user: config.user,
                pass: config.pass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // ─── LOGO CID INJECTION ───
        const finalAttachments = [...attachments];
        let logoPath = null;

        if (setting && setting.logoUrl) {
            logoPath = path.join(__dirname, '..', setting.logoUrl);
        }

        // If no custom logo path or file doesn't exist, check/copy HunarAsaanLogo.jpg
        if (!logoPath || !fs.existsSync(logoPath)) {
            const possibleLogo = path.join(__dirname, '../uploads/settings/logo.jpg');
            if (fs.existsSync(possibleLogo)) {
                logoPath = possibleLogo;
            } else {
                const rootLogo = path.join(__dirname, '../../HunarAsaanLogo.jpg');
                if (fs.existsSync(rootLogo)) {
                    // Ensure uploads/settings folders exist
                    const settingsDir = path.join(__dirname, '../uploads/settings');
                    if (!fs.existsSync(settingsDir)) {
                        fs.mkdirSync(settingsDir, { recursive: true });
                    }
                    try {
                        fs.copyFileSync(rootLogo, possibleLogo);
                        logoPath = possibleLogo;
                        // Save to setting database
                        if (setting && !setting.logoUrl) {
                            await setting.update({ logoUrl: '/uploads/settings/logo.jpg' });
                        }
                    } catch (e) {
                        console.error('Failed to copy root logo to settings folder:', e.message);
                    }
                }
            }
        }

        // Attach logo if found on disk
        if (logoPath && fs.existsSync(logoPath)) {
            finalAttachments.push({
                filename: 'logo.jpg',
                path: logoPath,
                cid: 'hunar_asaan_logo' // Matches the src="cid:hunar_asaan_logo" in HTML templates
            });
        }

        const mailOptions = {
            from: `"Hunar Asaan" <${config.user}>`,
            to: to,
            subject: subject,
            html: htmlContent,
            attachments: finalAttachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent successfully to: ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Email sending failed to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

// Alert all active Admins and Managers
const sendAdminManagerNotification = async (subject, htmlContent, attachments = []) => {
    try {
        const staff = await User.findAll({
            where: {
                role: ['Admin', 'admin', 'Manager', 'manager'],
                status: 'Active'
            },
            attributes: ['email']
        });
        
        if (staff.length === 0) {
            console.log('No active Admins/Managers found to notify.');
            return;
        }

        const emails = staff.map(s => s.email);
        console.log(`Blasting notifications to Admins/Managers: ${emails.join(', ')}`);
        
        // Fire email sends concurrently without blocking primary request thread
        Promise.allSettled(emails.map(email => sendEmail(email, subject, htmlContent, attachments)))
            .then(results => {
                const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
                console.log(`📬 Security/Activity notifications dispatched: ${successes} succeeded`);
            });
    } catch (err) {
        console.error('Failed to notify administrators:', err.message);
    }
};

// Generate random password
const generateRandomPassword = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

module.exports = {
    sendEmail,
    sendAdminManagerNotification,
    generateRandomPassword
};