/**
 * Admin User Seeder
 * Run this after database sync to ensure admin user exists
 * Usage: Called automatically in server/index.js after DB sync
 */

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

async function seedAdminUser(db) {
    try {
        const { User } = db;

        // Check if ANY admin already exists (both known email addresses)
        const existingAdmin = await User.findOne({
            where: {
                email: {
                    [Op.in]: ['admin@hunarasaan.com', 'admin@hunar.com']
                }
            }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', existingAdmin.email);
            return existingAdmin;
        }

        // Create admin user
        const hashedPassword = bcrypt.hashSync('Admin@1234', 10);

        const admin = await User.create({
            name: 'Admin',
            email: 'admin@hunarasaan.com',
            password: hashedPassword,
            role: 'Admin',
            status: 'Active'
        });

        console.log('');
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║   ✅  Admin Account Created Successfully              ║');
        console.log('║                                                       ║');
        console.log('║   📧  Email:    admin@hunarasaan.com                  ║');
        console.log('║   🔑  Password: Admin@1234                            ║');
        console.log('║   👤  Role:     Admin                                 ║');
        console.log('╚══════════════════════════════════════════════════════╝');
        console.log('');

        return admin;
    } catch (error) {
        // Gracefully handle duplicate entry — do not crash the boot sequence
        if (
            error.name === 'SequelizeUniqueConstraintError' ||
            (error.parent && error.parent.code === 'ER_DUP_ENTRY')
        ) {
            console.log('ℹ️  Admin user already exists (duplicate key ignored). Continuing...');
            return null;
        }
        // Log but do NOT throw — a seeder failure should not crash the server
        console.error('⚠️  Failed to seed admin user (non-fatal):', error.message);
        return null;
    }
}

module.exports = { seedAdminUser };
