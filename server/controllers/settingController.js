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
            officialEmail: setting.officialEmail || 'info@hunarasaan.edu',
            officialWebsite: setting.officialWebsite || 'hunarasaan.edu',
            address: setting.address,
            logoUrl: setting.logoUrl,
            signatureUrl: setting.signatureUrl || null,
            authorizedSignatureUrl: setting.signatureUrl || null,
            signatureTitle: setting.signatureTitle || 'Authorized Signature',
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
            notificationRules: isAdmin ? (setting.notificationRules || '{}') : '{}',
            backupFrequency: isAdmin ? (setting.backupFrequency || 'manual') : 'manual',
            backupEmail: isAdmin ? (setting.backupEmail || '') : ''
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
            instituteName, contact, officialEmail, officialWebsite, address, emailServer, bankName, accountTitle, accountNo, ibanCode, paymentInstructions,
            emailNotificationsEnabled, enableLoginEmailAlerts, isStudentPortalMaintenance, maintenanceNoticeMessage,
            primaryAdminEmail, accountsEmail, operationsEmail, staffRecipients, globalCcEmails, notificationRules,
            backupFrequency, backupEmail, signatureTitle
        } = formData;

        const updatePayload = {
            instituteName: instituteName || setting.instituteName,
            contact: contact !== undefined ? contact : setting.contact,
            officialEmail: officialEmail !== undefined ? officialEmail : setting.officialEmail,
            officialWebsite: officialWebsite !== undefined ? officialWebsite : setting.officialWebsite,
            address: address !== undefined ? address : setting.address,
            signatureTitle: signatureTitle !== undefined ? signatureTitle : setting.signatureTitle,
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
            updatePayload.emailHost = emailServer.host !== undefined ? emailServer.host : setting.emailHost;
            updatePayload.emailPort = emailServer.port !== undefined ? emailServer.port : setting.emailPort;
            updatePayload.emailUser = emailServer.user !== undefined ? emailServer.user : setting.emailUser;
            updatePayload.emailPass = emailServer.pass !== undefined ? emailServer.pass : setting.emailPass;
        }

        // Handle logo and signature file uploads
        if (req.files) {
            if (Array.isArray(req.files)) {
                const logoFile = req.files.find(f => f.fieldname === 'logo');
                const sigFile = req.files.find(f => f.fieldname === 'signature' || f.fieldname === 'authorizedSignature');
                if (logoFile) updatePayload.logoUrl = `/uploads/settings/${logoFile.filename}`;
                if (sigFile) updatePayload.signatureUrl = `/uploads/settings/${sigFile.filename}`;
            } else {
                if (req.files.logo && req.files.logo[0]) {
                    updatePayload.logoUrl = `/uploads/settings/${req.files.logo[0].filename}`;
                }
                const sig = (req.files.signature && req.files.signature[0]) || (req.files.authorizedSignature && req.files.authorizedSignature[0]);
                if (sig) {
                    updatePayload.signatureUrl = `/uploads/settings/${sig.filename}`;
                }
            }
        } else if (req.file) {
            if (req.file.fieldname === 'signature' || req.file.fieldname === 'authorizedSignature') {
                updatePayload.signatureUrl = `/uploads/settings/${req.file.filename}`;
            } else {
                updatePayload.logoUrl = `/uploads/settings/${req.file.filename}`;
            }
        }

        // FIX: Reassign so in-memory `setting` reflects the saved DB values
        setting = await setting.update(updatePayload);

        // Build response using updatePayload where available (critical for new file URLs)
        // This ensures newly uploaded signatureUrl / logoUrl are always returned,
        // not the pre-update in-memory values.
        const newSignatureUrl = updatePayload.signatureUrl || setting.signatureUrl || null;
        const newLogoUrl = updatePayload.logoUrl || setting.logoUrl || null;

        res.json({
            message: 'Settings updated successfully',
            instituteName: setting.instituteName,
            contact: setting.contact,
            officialEmail: setting.officialEmail || 'info@hunarasaan.edu',
            officialWebsite: setting.officialWebsite || 'hunarasaan.edu',
            address: setting.address,
            logoUrl: newLogoUrl,
            signatureUrl: newSignatureUrl,
            authorizedSignatureUrl: newSignatureUrl,
            signatureTitle: setting.signatureTitle || 'Authorized Signature',
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

        // Emit AFTER response so socket-triggered refetch doesn't race ahead
        // of the HTTP response and clobber the newly uploaded file URL in AppContext.
        emitToAll('data-updated', { type: 'settings' });
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

/**
 * Upload Authorized Signature Endpoint
 * POST /api/settings/upload-signature
 */
const uploadSignature = async (req, res) => {
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = await Setting.create({ instituteName: 'Hunar Asaan' });
        }

        let uploadedFile = null;
        if (req.file) {
            uploadedFile = req.file;
        } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            uploadedFile = req.files[0];
        }

        if (!uploadedFile) {
            return res.status(400).json({ error: 'No signature file uploaded.' });
        }

        const signatureUrl = `/uploads/settings/${uploadedFile.filename}`;
        await setting.update({ signatureUrl });

        emitToAll('data-updated', { type: 'settings' });

        res.json({
            message: 'Authorized signature uploaded successfully',
            authorizedSignatureUrl: signatureUrl,
            signatureUrl
        });
    } catch (error) {
        console.error('Upload signature error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getEmailSettings,
    updateEmailSettings,
    uploadSignature
};
