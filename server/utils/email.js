const nodemailer = require('nodemailer');
const { Setting, User } = require('../models');

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

// Send single email function
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const config = await getSMTPConfig();
        
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

        const mailOptions = {
            from: `"Hunar Asaan" <${config.user}>`,
            to: to,
            subject: subject,
            html: htmlContent
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
const sendAdminManagerNotification = async (subject, htmlContent) => {
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
        Promise.allSettled(emails.map(email => sendEmail(email, subject, htmlContent)))
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