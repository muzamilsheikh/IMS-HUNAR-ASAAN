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

// Send single email function with inline logo template replacement
const sendEmail = async (to, subject, htmlContent, attachments = [], eventCategory = null) => {
    try {
        const config = await getSMTPConfig();
        const setting = await Setting.findOne();
        
        // Skip sending if notifications are globally disabled
        if (!config.notificationsEnabled) {
            console.log(`✉️ Email notifications globally disabled. Skipped sending to: ${to}`);
            return { success: true, skipped: true };
        }

        let finalTo = to;
        let shouldSend = true;

        if (setting && setting.notificationRules) {
            try {
                const rules = JSON.parse(setting.notificationRules);
                if (eventCategory === 'admission') {
                    if (rules.admission && (rules.admission.enabled === false || rules.admission.student === false)) {
                        shouldSend = false;
                    }
                } else if (eventCategory === 'payment') {
                    if (rules.payment && (rules.payment.enabled === false || rules.payment.student === false)) {
                        shouldSend = false;
                    }
                } else if (eventCategory === 'updates') {
                    if (rules.updates && rules.updates.enabled === false) {
                        shouldSend = false;
                    }
                } else if (eventCategory === 'overdue') {
                    if (rules.overdue && rules.overdue.enabled === false) {
                        shouldSend = false;
                    } else if (rules.overdue) {
                        if (rules.overdue.student === false) {
                            if (rules.overdue.accountsCc !== false && setting.accountsEmail) {
                                finalTo = setting.accountsEmail;
                            } else {
                                shouldSend = false;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error parsing notificationRules in sendEmail:', err.message);
            }
        }

        if (!shouldSend) {
            console.log(`✉️ Email sending skipped by notification toggle rules for: ${to} (Category: ${eventCategory || 'unspecified'})`);
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

        // ─── DYNAMIC LOGO HOSTED URL SUBSTITUTION ───
        const baseWebUrl = 'https://ims.hunarasaan.com';
        
        const logoUrl = setting && setting.logoUrl 
            ? `${baseWebUrl}${setting.logoUrl}` 
            : `${baseWebUrl}/HunarAsaanLogo.jpg`;
            
        const processedHtml = htmlContent.replace(/__LOGO_URL_PLACEHOLDER__/g, logoUrl);

        // Retrieve global CC emails
        let ccEmails = [];
        if (setting && setting.globalCcEmails) {
            let includeCc = true;
            if (eventCategory && setting.notificationRules) {
                try {
                    const rules = JSON.parse(setting.notificationRules);
                    if (eventCategory === 'admission' && rules.admission && rules.admission.ccList === false) {
                        includeCc = false;
                    } else if (eventCategory === 'payment' && rules.payment && rules.payment.ccList === false) {
                        includeCc = false;
                    } else if (eventCategory === 'updates' && rules.updates && rules.updates.ccList === false) {
                        includeCc = false;
                    } else if (eventCategory === 'overdue' && rules.overdue && rules.overdue.accountsCc === false) {
                        includeCc = false;
                    }
                } catch (e) {
                    console.error('Error checking includeCc in sendEmail:', e.message);
                }
            }
            if (includeCc) {
                ccEmails = setting.globalCcEmails.split(',')
                    .map(email => email.trim())
                    .filter(email => email !== '');
            }
        }

        // For overdue reminders, append accounts email to CC if checked
        if (eventCategory === 'overdue' && setting && setting.accountsEmail) {
            try {
                const rules = JSON.parse(setting.notificationRules || '{}');
                if (rules.overdue && rules.overdue.accountsCc !== false) {
                    if (finalTo.toLowerCase().trim() !== setting.accountsEmail.toLowerCase().trim()) {
                        ccEmails.push(setting.accountsEmail);
                    }
                }
            } catch (e) {}
        }

        // De-duplicate CC list
        ccEmails = [...new Set(ccEmails.map(e => e.trim().toLowerCase()))].filter(Boolean);

        const mailOptions = {
            from: `"Hunar Asaan" <${config.user}>`,
            to: finalTo,
            subject: subject,
            html: processedHtml,
            attachments: attachments
        };

        if (ccEmails.length > 0) {
            mailOptions.cc = ccEmails;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent successfully to: ${finalTo} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Email sending failed to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

// Alert all active Admins and Managers (dynamically routed if settings exist)
const sendAdminManagerNotification = async (subject, htmlContent, attachments = [], eventCategory = null) => {
    try {
        const setting = await Setting.findOne();
        
        let resolvedCategory = eventCategory;
        if (!resolvedCategory) {
            const subjectLower = subject.toLowerCase();
            if (subjectLower.includes('payment') || subjectLower.includes('fee') || subjectLower.includes('challan') || subjectLower.includes('ledger') || subjectLower.includes('salary') || subjectLower.includes('payroll') || subjectLower.includes('receipt')) {
                resolvedCategory = 'payment';
            } else if (subjectLower.includes('admission') || subjectLower.includes('enrolled') || subjectLower.includes('student') || subjectLower.includes('scholar') || subjectLower.includes('batch') || subjectLower.includes('course')) {
                resolvedCategory = 'admission';
            } else if (subjectLower.includes('update') || subjectLower.includes('platform') || subjectLower.includes('system')) {
                resolvedCategory = 'updates';
            } else if (subjectLower.includes('overdue') || subjectLower.includes('reminder')) {
                resolvedCategory = 'overdue';
            }
        }

        // If category is resolved and disabled, abort early!
        if (setting && setting.notificationRules && resolvedCategory) {
            try {
                const rules = JSON.parse(setting.notificationRules);
                if (rules[resolvedCategory] && rules[resolvedCategory].enabled === false) {
                    console.log(`✉️ Category [${resolvedCategory}] notification disabled by master toggle.`);
                    return { success: true, skipped: true, reason: `Category [${resolvedCategory}] disabled by master toggle` };
                }
            } catch (e) {
                console.error('Failed to parse notificationRules in sendAdminManagerNotification:', e.message);
            }
        }
        
        let recipientEmails = [];
        
        // 1. Route based on subject/alert type keywords & checkbox rules
        if (setting) {
            try {
                const rules = JSON.parse(setting.notificationRules || '{}');
                
                if (resolvedCategory === 'payment') {
                    const rule = rules.payment || {};
                    if (rule.accounts !== false && setting.accountsEmail) {
                        recipientEmails.push(setting.accountsEmail);
                    }
                    if (rule.primaryAdmin !== false && setting.primaryAdminEmail) {
                        recipientEmails.push(setting.primaryAdminEmail);
                    }
                } else if (resolvedCategory === 'admission') {
                    const rule = rules.admission || {};
                    if (rule.primaryAdmin !== false && setting.primaryAdminEmail) {
                        recipientEmails.push(setting.primaryAdminEmail);
                    }
                    if (rule.operations !== false && setting.operationsEmail) {
                        recipientEmails.push(setting.operationsEmail);
                    }
                } else if (resolvedCategory === 'updates') {
                    const rule = rules.updates || {};
                    if (rule.allStaff !== false && setting.staffRecipients) {
                        const customStaff = JSON.parse(setting.staffRecipients);
                        if (Array.isArray(customStaff)) {
                            customStaff.forEach(s => {
                                if (s.email) recipientEmails.push(s.email);
                            });
                        }
                    }
                } else if (resolvedCategory === 'overdue') {
                    const rule = rules.overdue || {};
                    if (rule.accountsCc !== false && setting.accountsEmail) {
                        recipientEmails.push(setting.accountsEmail);
                    }
                } else {
                    // Fallback to default routing keywords if unresolved or not in rule set
                    const subjectLower = subject.toLowerCase();
                    if (subjectLower.includes('payment') || subjectLower.includes('fee') || subjectLower.includes('challan') || subjectLower.includes('ledger') || subjectLower.includes('salary') || subjectLower.includes('payroll')) {
                        if (setting.accountsEmail) recipientEmails.push(setting.accountsEmail);
                    } else if (subjectLower.includes('admission') || subjectLower.includes('enrolled') || subjectLower.includes('student') || subjectLower.includes('scholar') || subjectLower.includes('batch') || subjectLower.includes('course')) {
                        if (setting.operationsEmail) recipientEmails.push(setting.operationsEmail);
                    } else if (subjectLower.includes('security') || subjectLower.includes('login') || subjectLower.includes('session')) {
                        if (setting.primaryAdminEmail) recipientEmails.push(setting.primaryAdminEmail);
                    }
                }
            } catch (err) {
                console.error('Error applying recipient rules:', err.message);
            }
        }
        
        // 2. Add custom staff recipients list from Settings (unless it's an updates alert, which explicitly specifies staff routing)
        if (resolvedCategory !== 'updates' && setting && setting.staffRecipients) {
            try {
                const customStaff = JSON.parse(setting.staffRecipients);
                if (Array.isArray(customStaff)) {
                    customStaff.forEach(s => {
                        if (s.email) recipientEmails.push(s.email);
                    });
                }
            } catch (err) {
                console.error('Failed to parse staffRecipients JSON:', err.message);
            }
        }
        
        // 3. Fallback to active Admins & Managers from database if no recipients resolved yet
        if (recipientEmails.length === 0) {
            const staffUsers = await User.findAll({
                where: {
                    role: ['Admin', 'admin', 'Manager', 'manager'],
                    status: 'Active'
                },
                attributes: ['email']
            });
            recipientEmails = staffUsers.map(s => s.email);
        }
        
        // Remove duplicates and trim emails
        const uniqueEmails = [...new Set(recipientEmails.map(e => e.trim().toLowerCase()))].filter(Boolean);
        
        if (uniqueEmails.length === 0) {
            console.log('No notification recipients found.');
            return { success: true, skipped: true, reason: 'No recipients resolved' };
        }

        console.log(`Blasting notifications to resolved recipients: ${uniqueEmails.join(', ')}`);
        
        // Fire email sends concurrently without blocking primary request thread
        Promise.allSettled(uniqueEmails.map(email => sendEmail(email, subject, htmlContent, attachments, resolvedCategory)))
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