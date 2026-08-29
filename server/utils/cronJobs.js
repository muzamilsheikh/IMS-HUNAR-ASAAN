'use strict';

const cron = require('node-cron');

/**
 * initCronJobs — registers all scheduled background tasks.
 * Call this AFTER database sync succeeds inside server/index.js.
 *
 *  JOB 1: Monthly Salary Initializer  ('0 0 1 * *')
 *    – Creates one PENDING SalaryPayment per active staff for the new month.
 *    – Wrapped in a transaction; skips months that already have a record.
 *
 *  JOB 2: Installment Overdue Checker ('0 0 * * *')
 *    – Bulk-marks any Installment where status=PENDING and due_date < TODAY as OVERDUE.
 */
const initCronJobs = () => {
    // ─────────────────────────────────────────────────────────────────────────
    // JOB 1 — Monthly Salary Initializer
    // Runs at 00:00 on the 1st of every month
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 1 * *', async () => {
        console.log('[CRON] Monthly Salary Initializer: starting...');

        // Lazy-require models so this file can be loaded before DB is ready.
        let User, SalaryPayment, sequelize;
        try {
            const models = require('../models');
            User         = models.User;
            SalaryPayment = models.SalaryPayment;
            sequelize    = models.sequelize;
        } catch (loadErr) {
            console.error('[CRON] Salary Init — failed to load models:', loadErr.message);
            return;
        }

        const transaction = await sequelize.transaction();
        try {
            // Build current month-year string in MM-YYYY format
            const now       = new Date();
            const month_year = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

            // Fetch all active staff members that have a base_salary defined
            const staffList = await User.findAll({
                where: { role: 'Staff' },
                attributes: ['id', 'name', 'base_salary'],
                transaction
            });

            if (staffList.length === 0) {
                console.log(`[CRON] Salary Init — no active staff found for ${month_year}`);
                await transaction.rollback();
                return;
            }

            let created = 0;
            for (const staff of staffList) {
                // Skip if a salary record already exists for this staff + month_year
                const exists = await SalaryPayment.findOne({
                    where: { staff_id: staff.id, month_year },
                    transaction
                });

                if (exists) {
                    console.log(`[CRON] Salary Init — skipping ${staff.name} (record exists for ${month_year})`);
                    continue;
                }

                await SalaryPayment.create({
                    staff_id:      staff.id,
                    month_year,
                    base_pay:      parseFloat(staff.base_salary || 0),
                    status:        'PENDING',
                    disbursal_date: null
                }, { transaction });

                created++;
            }

            await transaction.commit();
            console.log(`[CRON] ✅ ${created} salary record(s) initialized for ${month_year}`);
        } catch (err) {
            await transaction.rollback();
            // Non-fatal: log and continue — server must NOT crash
            console.error('[CRON] ❌ Salary Init failed:', err.message);
        }
    }, {
        timezone: 'Asia/Karachi'   // adjust to your deployment timezone
    });

    // ─────────────────────────────────────────────────────────────────────────
    // JOB 2 — Installment Overdue Checker
    // Runs every day at midnight
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Installment Overdue Checker: starting...');

        let Installment, Op;
        try {
            const models = require('../models');
            Installment  = models.Installment;
            Op           = models.Op;
        } catch (loadErr) {
            console.error('[CRON] Overdue Checker — failed to load models:', loadErr.message);
            return;
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);   // normalise to start of day

            const [count] = await Installment.update(
                { status: 'OVERDUE' },
                {
                    where: {
                        status:   'PENDING',
                        due_date: { [Op.lt]: today }
                    }
                }
            );

            console.log(`[CRON] ✅ ${count} installment(s) marked OVERDUE`);
        } catch (err) {
            // Non-fatal: log and continue — server must NOT crash
            console.error('[CRON] ❌ Installment Overdue check failed:', err.message);
        }
    }, {
        timezone: 'Asia/Karachi'
    });

    // ─────────────────────────────────────────────────────────────────────────
    // JOB 3 — Daily Backup Trigger (Midnight)
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Daily Backup Trigger starting...');
        await runScheduledBackup('daily');
    }, { timezone: 'Asia/Karachi' });

    // ─────────────────────────────────────────────────────────────────────────
    // JOB 4 — Weekly Backup Trigger (Sunday at Midnight)
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 * * 0', async () => {
        console.log('[CRON] Weekly Backup Trigger starting...');
        await runScheduledBackup('weekly');
    }, { timezone: 'Asia/Karachi' });

    // ─────────────────────────────────────────────────────────────────────────
    // JOB 5 — Monthly Backup Trigger (1st of month at Midnight)
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 1 * *', async () => {
        console.log('[CRON] Monthly Backup Trigger starting...');
        await runScheduledBackup('monthly');
    }, { timezone: 'Asia/Karachi' });

    console.log('[CRON] ✅ All cron jobs registered (Salary Initializer + Overdue Checker + Backup Schedulers)');
};

/**
 * Scheduled backup executor helper
 */
const runScheduledBackup = async (frequency) => {
    let Setting, BackupLog;
    try {
        const models = require('../models');
        Setting = models.Setting;
        BackupLog = models.BackupLog;
    } catch (loadErr) {
        console.error('[CRON] Backup scheduler — failed to load models:', loadErr.message);
        return;
    }

    try {
        const setting = await Setting.findOne();
        if (!setting || setting.backupFrequency !== frequency || !setting.backupEmail) {
            console.log(`[CRON] Backup skipped for frequency: ${frequency} (Not configured or email missing)`);
            return;
        }

        console.log(`[CRON] Executing scheduled backup (${frequency}) for ${setting.backupEmail}...`);
        
        const { generateBackupFile } = require('../controllers/backupController');
        const { sendEmail } = require('./email');
        const fs = require('fs');

        const { filePath, filename } = await generateBackupFile(`Automated ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`);
        const fileBuffer = fs.readFileSync(filePath);

        const emailSubject = `Automated Database Backup - ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
                <h2 style="color: #0f172a;">Automated Database Backup Complete</h2>
                <p>Hello Admin,</p>
                <p>Your scheduled automated database backup (${frequency}) has been successfully processed.</p>
                <p><strong>Backup File Name:</strong> ${filename}</p>
                <p><strong>Frequency:</strong> ${frequency.toUpperCase()}</p>
                <p><strong>Compiled At:</strong> ${new Date().toLocaleString()}</p>
                <p>Please find the compressed SQL/JSON archive attached to this email.</p>
                <br />
                <p style="font-size: 11px; color: #94a3b8;">This is a scheduled security backup broadcast from Hunar Asaan CRM.</p>
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
            type: `Automated ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`,
            status: 'Success'
        });

        console.log(`[CRON] ✅ Scheduled backup (${frequency}) complete & emailed to ${setting.backupEmail}`);
    } catch (err) {
        console.error(`[CRON] ❌ Scheduled backup (${frequency}) failed:`, err.message);
        try {
            await BackupLog.create({
                filename: `backup_failed_${Date.now()}.gz`,
                type: `Automated ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`,
                status: 'Failed',
                error: err.message
            });
        } catch (e) {
            console.error('Failed to log backup failure to DB:', e.message);
        }
    }
};

module.exports = { initCronJobs };
