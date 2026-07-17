const { ActivityLog } = require('../models');

/**
 * Logs a system activity to the database.
 * @param {number|null} userId - The ID of the user performing the action.
 * @param {string} action - The classification of the action (e.g. 'Student Registration').
 * @param {string} details - A detailed description of the event.
 */
const logActivity = async (userId, action, details) => {
    try {
        await ActivityLog.create({
            userId: userId || null,
            action,
            details
        });
        console.log(`[Activity Log] ${action}: ${details}`);
    } catch (err) {
        console.error('❌ Failed to save activity log:', err.message);
    }
};

module.exports = { logActivity };
