'use strict';

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { Setting, BackupLog, sequelize } = require('../models');
const models = require('../models');
const { sendEmail } = require('../utils/email');

const backupsDir = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Helper to generate a database backup (SQL or JSON) and compress it with gzip
 */
const generateBackupFile = async (type = 'Automated') => {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    const timestamp = Date.now();

    return new Promise(async (resolve, reject) => {
        // Try mysqldump first
        const dumpCommand = `mysqldump -h ${host} -u ${user} ${password ? `-p"${password}"` : ''} --single-transaction --quick --lock-tables=false ${database}`;
        
        exec(dumpCommand, { maxBuffer: 1024 * 1024 * 100 }, async (error, stdout, stderr) => {
            let backupContent;
            let formatExtension = 'sql';

            if (error) {
                console.warn('[BACKUP] mysqldump failed or not found, falling back to Sequelize JSON dump:', error.message);
                // Fallback to Sequelize JSON dump
                try {
                    const dump = {};
                    for (const modelName of Object.keys(models)) {
                        if (['sequelize', 'Sequelize', 'Op', 'BackupLog'].includes(modelName)) continue;
                        dump[modelName] = await models[modelName].findAll({ raw: true });
                    }
                    backupContent = JSON.stringify(dump, null, 2);
                    formatExtension = 'json';
                } catch (fallbackErr) {
                    console.error('[BACKUP] Fallback JSON dump failed:', fallbackErr.message);
                    return reject(new Error(`Backup failed: ${fallbackErr.message}`));
                }
            } else {
                backupContent = stdout;
            }

            try {
                // Compress content using Node's native zlib
                const compressedBuffer = zlib.gzipSync(Buffer.from(backupContent, 'utf-8'));
                const filename = `backup_${timestamp}.${formatExtension}.gz`;
                const filePath = path.join(backupsDir, filename);

                fs.writeFileSync(filePath, compressedBuffer);
                resolve({ filePath, filename, formatExtension });
            } catch (writeErr) {
                console.error('[BACKUP] Failed to compress and write backup file:', writeErr.message);
                reject(writeErr);
            }
        });
    });
};

/**
 * GET /api/settings/backup/logs
 * Fetches all backup activity logs sorted by latest first
 */
const getBackupHistory = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        const logs = await BackupLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json(logs);
    } catch (error) {
        console.error('[BACKUP] Get backup history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * POST /api/settings/backup/generate
 * Instantly generates a database backup and sends it as a browser download attachment
 */
const downloadBackupNow = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        const { filePath, filename } = await generateBackupFile('Manual');

        // Log success
        await BackupLog.create({
            filename,
            type: 'Manual Download',
            status: 'Success'
        });

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('[BACKUP] Res.download failed:', err.message);
            }
        });
    } catch (error) {
        console.error('[BACKUP] Download backup trigger failed:', error);
        
        await BackupLog.create({
            filename: `backup_failed_${Date.now()}.gz`,
            type: 'Manual Download',
            status: 'Failed',
            error: error.message
        });

        res.status(500).json({ error: error.message || 'Backup failed' });
    }
};

/**
 * POST /api/settings/backup/email
 * Generates a backup on-demand and sends it via email to the configured recipient address
 */
const emailBackupNow = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        const setting = await Setting.findOne();
        if (!setting || !setting.backupEmail) {
            return res.status(400).json({ error: 'Target backup email is not configured in Settings.' });
        }

        const { filePath, filename } = await generateBackupFile('Manual Email');

        const fileBuffer = fs.readFileSync(filePath);

        const emailSubject = `Database Backup Alert - Manual Trigger`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
                <h2 style="color: #0f172a;">Database Backup Complete</h2>
                <p>Hello Admin,</p>
                <p>A manual database backup has been successfully triggered and compiled.</p>
                <p><strong>Backup File Name:</strong> ${filename}</p>
                <p><strong>Compiled At:</strong> ${new Date().toLocaleString()}</p>
                <p>Please find the compressed backup archive attached to this email.</p>
                <br />
                <p style="font-size: 11px; color: #94a3b8;">This is an automated security broadcast from Hunar Asaan CRM.</p>
            </div>
        `;

        const attachments = [{
            filename,
            content: fileBuffer,
            contentType: 'application/gzip'
        }];

        const emailRes = await sendEmail(setting.backupEmail, emailSubject, emailHtml, attachments);

        if (!emailRes.success) {
            throw new Error(`Email dispatch failed: ${emailRes.error}`);
        }

        await BackupLog.create({
            filename,
            type: 'Send to Email Now',
            status: 'Success'
        });

        res.json({ success: true, message: `Backup successfully generated and emailed to ${setting.backupEmail}` });
    } catch (error) {
        console.error('[BACKUP] Email backup triggered error:', error);

        await BackupLog.create({
            filename: `backup_failed_${Date.now()}.gz`,
            type: 'Send to Email Now',
            status: 'Failed',
            error: error.message
        });

        res.status(500).json({ error: error.message || 'Backup fail' });
    }
};

/**
 * POST /api/settings/backup/restore
 * Receives a `.gz` compressed backup file (containing SQL or JSON), decompress and restore it
 */
const restoreBackup = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No backup file uploaded.' });
        }

        const uploadedFilePath = req.file.path;
        const originalName = req.file.originalname;

        let content;
        try {
            // Read and decompress .gz file
            const fileBuffer = fs.readFileSync(uploadedFilePath);
            const decompressed = zlib.gunzipSync(fileBuffer);
            content = decompressed.toString('utf-8');
        } catch (decompressErr) {
            console.warn('[RESTORE] Gzip decompression failed, attempting to read as raw text:', decompressErr.message);
            content = fs.readFileSync(uploadedFilePath, 'utf-8');
        }

        const isJson = originalName.endsWith('.json') || originalName.endsWith('.json.gz') || content.trim().startsWith('{');

        if (isJson) {
            // Restore from JSON
            const data = JSON.parse(content);
            const transaction = await sequelize.transaction();

            try {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
                
                for (const modelName of Object.keys(data)) {
                    if (models[modelName] && typeof models[modelName].destroy === 'function') {
                        await models[modelName].destroy({ where: {}, truncate: true, transaction, force: true });
                        if (data[modelName] && data[modelName].length > 0) {
                            await models[modelName].bulkCreate(data[modelName], { transaction });
                        }
                    }
                }

                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
                await transaction.commit();
            } catch (dbErr) {
                await transaction.rollback();
                throw dbErr;
            }
        } else {
            // Restore from SQL
            const statements = content
                .split(/;\s*$/m)
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

            const transaction = await sequelize.transaction();
            try {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
                for (const stmt of statements) {
                    await sequelize.query(stmt, { transaction });
                }
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
                await transaction.commit();
            } catch (dbErr) {
                await transaction.rollback();
                throw dbErr;
            }
        }

        // Log success
        await BackupLog.create({
            filename: originalName,
            type: 'Import/Restore',
            status: 'Success'
        });

        // Clean up uploaded file from uploads/
        try { fs.unlinkSync(uploadedFilePath); } catch (err) {}

        res.json({ success: true, message: 'Database successfully restored and synchronized.' });
    } catch (error) {
        console.error('[RESTORE] Restore failed:', error);

        await BackupLog.create({
            filename: req.file ? req.file.originalname : 'unknown_file',
            type: 'Import/Restore',
            status: 'Failed',
            error: error.message
        });

        // Clean up file if present
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (err) {}
        }

        res.status(500).json({ error: error.message || 'Database restore failed.' });
    }
};

/**
 * GET /api/settings/backup/download/:id
 * Allows download of a previously stored backup log file from backups/ directory
 */
const downloadStoredBackup = async (req, res) => {
    try {
        const isAdmin = req.user.role.toLowerCase().trim() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admin role required' });
        }

        const log = await BackupLog.findByPk(req.params.id);
        if (!log) {
            return res.status(404).json({ error: 'Backup log not found' });
        }

        const filePath = path.join(backupsDir, log.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup archive file no longer exists on the server filesystem.' });
        }

        res.download(filePath, log.filename);
    } catch (error) {
        console.error('[BACKUP] Download stored backup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    generateBackupFile,
    getBackupHistory,
    downloadBackupNow,
    emailBackupNow,
    restoreBackup,
    downloadStoredBackup
};
