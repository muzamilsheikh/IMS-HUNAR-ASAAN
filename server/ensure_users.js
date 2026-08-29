require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function ensureUsers() {
    try {
        // 1. admin@hunar.com -> admin123
        const admin1 = await User.findOne({ where: { email: 'admin@hunar.com' } });
        const hash1 = await bcrypt.hash('admin123', 10);
        if (!admin1) {
            const newUser = await User.create({
                name: 'Admin Hunar',
                email: 'admin@hunar.com',
                password: hash1,
                role: 'Admin'
            });
            console.log('✅ Created admin@hunar.com');
        } else {
            await admin1.update({ password: hash1, role: 'Admin' });
            console.log('✅ Updated admin@hunar.com password');
        }

        // 2. admin@hunarasaan.com -> Hun@r@s@@n@786@867
        const admin2 = await User.findOne({ where: { email: 'admin@hunarasaan.com' } });
        const hash2 = await bcrypt.hash('Hun@r@s@@n@786@867', 10);
        if (!admin2) {
            const newUser = await User.create({
                name: 'Admin Hunar Asaan',
                email: 'admin@hunarasaan.com',
                password: hash2,
                role: 'Admin'
            });
            console.log('✅ Created admin@hunarasaan.com');
        } else {
            await admin2.update({ password: hash2, role: 'Admin' });
            console.log('✅ Updated admin@hunarasaan.com password');
        }

    } catch (e) {
        console.error('Error ensuring users:', e.message);
    } finally {
        process.exit(0);
    }
}

ensureUsers();
