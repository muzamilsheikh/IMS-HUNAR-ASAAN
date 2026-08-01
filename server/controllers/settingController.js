const { Setting } = require('../models');
const path = require('path');
const fs = require('fs');
const { emitToAll } = require('../socket');

// GET settings (always returns the first/only settings record)
const getSettings = async (req, res) => {
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            // Auto-create default settings if none exist
            setting = await Setting.create({
                instituteName: 'Hunar Asaan',
                contact: '',
                address: '',
                logoUrl: null,
                emailHost: '',
                emailPort: '587',
                emailUser: '',
                emailPass: '',
                emailNotificationsEnabled: true,
                enableLoginEmailAlerts: true
            });
        }

        const isAdmin = req.user && req.user.role && req.user.role.toLowerCase().trim() === 'admin';

        // Return in the shape the frontend expects
        res.json({
            instituteName: setting.instituteName,
            contact: setting.contact,
            address: setting.address,
            logoUrl: setting.logoUrl,
            emailNotificationsEnabled: setting.emailNotificationsEnabled !== false,
            enableLoginEmailAlerts: setting.enableLoginEmailAlerts !== false,
            isStudentPortalMaintenance: setting.isStudentPortalMaintenance === true,
            maintenanceNoticeMessage: setting.maintenanceNoticeMessage || 'Student Portal is currently under scheduled maintenance. We will be back online shortly!',
            emailServer: isAdmin ? {
                host: setting.emailHost || '',
                port: setting.emailPort || '587',
                user: setting.emailUser || '',
                pass: setting.emailPass || ''
            } : {
                host: '',
                port: '587',
                user: '',
                pass: ''
            },
            bankName: setting.bankName || '',
            accountTitle: setting.accountTitle || '',
            accountNo: setting.accountNo || '',
            ibanCode: setting.ibanCode || '',
            paymentInstructions: setting.paymentInstructions || '',
            primaryAdminEmail: isAdmin ? (setting.primaryAdminEmail || '') : '',
            accountsEmail: isAdmin ? (setting.accountsEmail || '') : '',
            operationsEmail: isAdmin ? (setting.operationsEmail || '') : '',
            staffRecipients: isAdmin ? (setting.staffRecipients || '[]') : '[]',
            globalCcEmails: isAdmin ? (setting.globalCcEmails || '') : '',
            notificationRules: isAdmin ? (setting.notificationRules || '{}') : '{}'
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// PUT update settings (handles both JSON and FormData)
const updateSettings = async (req, res) => {
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = await Setting.create({ instituteName: 'Hunar Asaan' });
        }

        // Support both JSON body and FormData with 'data' field
        let formData = req.body;
        if (req.body.data) {
            try { formData = JSON.parse(req.body.data); } catch (e) { formData = req.body; }
        }

        const {
            instituteName, contact, address, emailServer, bankName, accountTitle, accountNo, ibanCode, paymentInstructions,
            emailNotificationsEnabled, enableLoginEmailAlerts, isStudentPortalMaintenance, maintenanceNoticeMessage,
            primaryAdminEmail, accountsEmail, operationsEmail, staffRecipients, globalCcEmails, notificationRules,
            backupFrequency, backupEmail
        } = formData;

        const updatePayload = {
            instituteName: instituteName || setting.instituteName,
            contact: contact !== undefined ? contact : setting.contact,
            address: address !== undefined ? address : setting.address,
            bankName: bankName !== undefined ? bankName : setting.bankName,
            accountTitle: accountTitle !== undefined ? accountTitle : setting.accountTitle,
            accountNo: accountNo !== undefined ? accountNo : setting.accountNo,
            ibanCode: ibanCode !== undefined ? ibanCode : setting.ibanCode,
            paymentInstructions: paymentInstructions !== undefined ? paymentInstructions : setting.paymentInstructions,
            emailNotificationsEnabled: emailNotificationsEnabled !== undefined ? emailNotificationsEnabled : setting.emailNotificationsEnabled,
            enableLoginEmailAlerts: enableLoginEmailAlerts !== undefined ? enableLoginEmailAlerts : setting.enableLoginEmailAlerts,
            isStudentPortalMaintenance: isStudentPortalMaintenance !== undefined ? isStudentPortalMaintenance : setting.isStudentPortalMaintenance,
            maintenanceNoticeMessage: maintenanceNoticeMessage !== undefined ? maintenanceNoticeMessage : setting.maintenanceNoticeMessage,
            primaryAdminEmail: primaryAdminEmail !== undefined ? primaryAdminEmail : setting.primaryAdminEmail,
            accountsEmail: accountsEmail !== undefined ? accountsEmail : setting.accountsEmail,
            operationsEmail: operationsEmail !== undefined ? operationsEmail : setting.operationsEmail,
            staffRecipients: staffRecipients !== undefined
                ? (typeof staffRecipients === 'string' ? staffRecipients : JSON.stringify(staffRecipients))
                : setting.staffRecipients,
            globalCcEmails: globalCcEmails !== undefined ? globalCcEmails : setting.globalCcEmails,
            notificationRules: notificationRules !== undefined
                ? (typeof notificationRules === 'string' ? notificationRules : JSON.stringify(notificationRules))
                : setting.notificationRules,
            backupFrequency: backupFrequency !== undefined ? backupFrequency : setting.backupFrequency,
            backupEmail: backupEmail !== undefined ? backupEmail : setting.backupEmail
        };

        if (emailServer) {
            updatePayload.emailHost = emailServer.host || setting.emailHost;
            updatePayload.emailPort = emailServer.port || setting.emailPort;
            updatePayload.emailUser = emailServer.user || setting.emailUser;
            updatePayload.emailPass = emailServer.pass || setting.emailPass;
        }

        // Handle logo file upload with proper directory structure
        if (req.file) {
            // Ensure settings directory exists
            const uploadsDir = path.join(__dirname, '../uploads');
            const settingsDir = path.join(uploadsDir, 'settings');
            
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true });
            }

            // Delete old logo if it exists
            if (setting.logoUrl) {
                const oldPath = path.join(__dirname, '..', setting.logoUrl);
                try {
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                } catch (err) {
                    console.warn('Could not delete old logo:', err.message);
                }
            }

            // Save new logo with relative path (Multer already saved it to settingsDir)
            updatePayload.logoUrl = `/uploads/settings/${req.file.filename}`;
        }

        await setting.update(updatePayload);

        // Emit real-time update event so the frontend syncs changes immediately
        emitToAll('data-updated', { type: 'settings' });

        res.json({
            message: 'Settings updated successfully',
            instituteName: setting.instituteName,
            contact: setting.contact,
            address: setting.address,
            logoUrl: setting.logoUrl,
            emailNotificationsEnabled: setting.emailNotificationsEnabled !== false,
            emailServer: {
                host: setting.emailHost || '',
                port: setting.emailPort || '587',
                user: setting.emailUser || '',
                pass: setting.emailPass || ''
            },
            bankName: setting.bankName,
            accountTitle: setting.accountTitle,
            accountNo: setting.accountNo,
            ibanCode: setting.ibanCode,
            paymentInstructions: setting.paymentInstructions,
            primaryAdminEmail: setting.primaryAdminEmail || '',
            accountsEmail: setting.accountsEmail || '',
            operationsEmail: setting.operationsEmail || '',
            staffRecipients: setting.staffRecipients || '[]',
            globalCcEmails: setting.globalCcEmails || '',
            notificationRules: setting.notificationRules || '{}',
            backupFrequency: setting.backupFrequency || 'manual',
            backupEmail: setting.backupEmail || ''
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

const getEmailSettings = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        const [setting] = await Setting.findOrCreate({
            where: {},
            defaults: {
                instituteName: 'Hunar Asaan',
                emailHost: 'smtp.gmail.com',
                emailPort: '587'
            }
        });

        res.json({
            primaryAdminEmail: setting.primaryAdminEmail || '',
            accountsEmail: setting.accountsEmail || '',
            operationsEmail: setting.operationsEmail || '',
            staffRecipients: setting.staffRecipients || '[]',
            globalCcEmails: setting.globalCcEmails || '',
            notificationRules: setting.notificationRules || '{}',
            emailNotificationsEnabled: setting.emailNotificationsEnabled !== false,
            enableLoginEmailAlerts: setting.enableLoginEmailAlerts !== false,
            emailServer: {
                host: setting.emailHost || '',
                port: setting.emailPort || '587',
                user: setting.emailUser || '',
                pass: setting.emailPass || ''
            }
        });
    } catch (error) {
        console.error('Get email settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateEmailSettings = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        const setting = await Setting.findOne();
        if (!setting) {
            return res.status(404).json({ error: 'Settings not initialized' });
        }

        const {
            primaryAdminEmail, accountsEmail, operationsEmail, staffRecipients, globalCcEmails,
            notificationRules, emailNotificationsEnabled, enableLoginEmailAlerts, emailServer
        } = req.body;

        const updatePayload = {
            primaryAdminEmail: primaryAdminEmail !== undefined ? primaryAdminEmail : setting.primaryAdminEmail,
            accountsEmail: accountsEmail !== undefined ? accountsEmail : setting.accountsEmail,
            operationsEmail: operationsEmail !== undefined ? operationsEmail : setting.operationsEmail,
            staffRecipients: staffRecipients !== undefined
                ? (typeof staffRecipients === 'string' ? staffRecipients : JSON.stringify(staffRecipients))
                : setting.staffRecipients,
            globalCcEmails: globalCcEmails !== undefined ? globalCcEmails : setting.globalCcEmails,
            notificationRules: notificationRules !== undefined
                ? (typeof notificationRules === 'string' ? notificationRules : JSON.stringify(notificationRules))
                : setting.notificationRules,
            emailNotificationsEnabled: emailNotificationsEnabled !== undefined ? emailNotificationsEnabled : setting.emailNotificationsEnabled,
            enableLoginEmailAlerts: enableLoginEmailAlerts !== undefined ? enableLoginEmailAlerts : setting.enableLoginEmailAlerts,
        };

        if (emailServer) {
            updatePayload.emailHost = emailServer.host || setting.emailHost;
            updatePayload.emailPort = emailServer.port || setting.emailPort;
            updatePayload.emailUser = emailServer.user || setting.emailUser;
            updatePayload.emailPass = emailServer.pass || setting.emailPass;
        }

        await setting.update(updatePayload);

        res.json({
            message: 'Email settings updated successfully',
            primaryAdminEmail: setting.primaryAdminEmail || '',
            accountsEmail: setting.accountsEmail || '',
            operationsEmail: setting.operationsEmail || '',
            staffRecipients: setting.staffRecipients || '[]',
            globalCcEmails: setting.globalCcEmails || '',
            notificationRules: setting.notificationRules || '{}',
            emailNotificationsEnabled: setting.emailNotificationsEnabled !== false,
            enableLoginEmailAlerts: setting.enableLoginEmailAlerts !== false,
            emailServer: {
                host: setting.emailHost || '',
                port: setting.emailPort || '587',
                user: setting.emailUser || '',
                pass: setting.emailPass || ''
            }
        });
    } catch (error) {
        console.error('Update email settings error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = { getSettings, updateSettings, getEmailSettings, updateEmailSettings };
