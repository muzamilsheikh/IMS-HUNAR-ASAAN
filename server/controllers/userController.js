const { User, Student, CourseInstructor, Op } = require('../models');
const bcrypt = require('bcryptjs');
const { sendEmail, generateRandomPassword } = require('../utils/email');
const { logActivity } = require('../utils/activity');

// Get all users (both staff and students)
const getAllUsers = async (req, res) => {
    try {

        // Get staff users (excluding students)
        const staffUsers = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
            where: {
                role: { [Op.ne]: 'Student' } // Exclude students from User table
            },
            order: [['createdAt', 'DESC']]
        });

        // Get student users (from Student table only)
        const students = await Student.findAll({
            attributes: ['id', 'name', 'email', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        // Format students to match user structure
        const studentUsers = students.map(student => ({
            id: `student_${student.id}`, // Prefix to avoid ID conflicts
            name: student.name,
            email: student.email,
            role: 'Student',
            status: 'Active', // Students are always active unless manually deactivated
            createdAt: student.createdAt,
            isStudent: true // Flag to identify student records
        }));

        // Combine and sort by creation date
        const allUsers = [...staffUsers, ...studentUsers].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            users: allUsers,
            stats: {
                totalUsers: allUsers.length,
                totalStaff: staffUsers.length,
                totalStudents: studentUsers.length,
                activeUsers: allUsers.filter(u => u.status === 'Active').length,
                inactiveUsers: allUsers.filter(u => u.status === 'Inactive').length
            }
        });
    } catch (error) {
        console.error('❌ Get all users error:', error.message);
        res.status(500).json({
            error: error.message || 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Create a new staff user
const createUser = async (req, res) => {
    try {
        const { name, email, role, password, specialty, associatedCourses } = req.body;

        // Validate required fields
        if (!name || !email || !role) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'role']
            });
        }

        // Validate role
        const validRoles = ['Admin', 'admin', 'Manager', 'manager', 'Ads Manager', 'Staff', 'Student', 'accounts_manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role',
                validRoles
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Generate password if not provided
        const userPassword = password || generateRandomPassword();

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

        // Create user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            specialty: role !== 'Student' ? specialty : null,
            status: 'Active'
        });

        // Eagerly create Student record if role is Student
        if (role === 'Student') {
            await Student.create({
                name,
                email,
                phone: '',
                status: 'Active'
            });
        }

        // Create course-staff junction mappings if associatedCourses is provided
        if (role !== 'Student' && Array.isArray(associatedCourses) && associatedCourses.length > 0) {
            const mappings = associatedCourses.map(courseId => ({
                userId: newUser.id,
                courseId: parseInt(courseId, 10)
            }));
            await CourseInstructor.bulkCreate(mappings);
        }

        // Send welcome email with credentials (fire and forget)
        sendEmail(
            email,
            'Welcome to Hunar Asaan CRM',
            `Welcome ${name}!\n\nYour account has been created successfully.\n\nEmail: ${email}\nPassword: ${userPassword}\n\nPlease change your password after first login.\n\nBest regards,\nHunar Asaan Team`
        ).catch(emailError => {
            console.warn('Failed to send welcome email:', emailError.message);
        });

        // Return user without password
        const { password: _, ...userResponse } = newUser.toJSON();

        await logActivity(
            req.user ? req.user.id : null,
            'User Authorisation',
            `Staff member "${name}" was authorized with role "${role}" by ${req.user ? req.user.name : 'System'}.`
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: userResponse,
            temporaryPassword: password ? undefined : userPassword // Only return if auto-generated
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Update user status
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                validStatuses: ['Active', 'Inactive']
            });
        }

        // Check if it's a student (prefixed ID)
        if (id.startsWith('student_')) {
            const studentId = id.replace('student_', '');
            const student = await Student.findByPk(studentId);

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            // For students, we don't actually change status in DB
            // We just return the updated status for frontend display
            return res.json({
                success: true,
                message: `Student ${status === 'Active' ? 'activated' : 'deactivated'} successfully`,
                user: {
                    id,
                    name: student.name,
                    email: student.email,
                    role: 'Student',
                    status,
                    createdAt: student.createdAt,
                    isStudent: true
                }
            });
        }

        // Handle staff user
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ status });

        res.json({
            success: true,
            message: `User ${status === 'Active' ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Reset user password
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Check if it's a student
        if (id.startsWith('student_')) {
            return res.status(400).json({
                error: 'Cannot reset password for students. Students use a different authentication system.'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new password if not provided
        const password = newPassword || generateRandomPassword();

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await user.update({ password: hashedPassword });

        await logActivity(
            user.id,
            'Password Reset',
            `User "${user.name}" (${user.email}) successfully reset their account password.`
        );

        // Send email with new password (fire and forget)
        sendEmail(
            user.email,
            'Password Reset - Hunar Asaan CRM',
            `Hello ${user.name},\n\nYour password has been reset.\n\nNew Password: ${password}\n\nPlease change your password after logging in.\n\nBest regards,\nHunar Asaan Team`
        ).catch(emailError => {
            console.warn('Failed to send password reset email:', emailError.message);
        });

        res.json({
            success: true,
            message: 'Password reset successfully',
            temporaryPassword: newPassword ? undefined : password
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Search active students by name, email, or phone
const searchStudents = async (req, res) => {
    try {
        const { q, query: queryParam } = req.query;
        const searchVal = (q || queryParam || '').trim();
        if (!searchVal) {
            return res.status(200).json([]);
        }

        const students = await Student.findAll({
            where: {
                status: 'Active',
                [Op.or]: [
                    { name: { [Op.like]: `%${searchVal}%` } },
                    { email: { [Op.like]: `%${searchVal}%` } },
                    { phone: { [Op.like]: `%${searchVal}%` } }
                ]
            },
            attributes: ['id', 'name', 'email', 'phone', 'cnic', 'address'],
            limit: 10
        });

        // Format to support both name and fullName aliases to prevent errors
        const formatted = students.map(student => {
            const data = student.toJSON();
            return {
                ...data,
                fullName: data.name,
                name: data.name
            };
        });

        return res.status(200).json(formatted);
    } catch (error) {
        console.error('Error searching students:', error);
        return res.status(500).json({ error: error.message || 'Internal server error during lookup' });
    }
};

// Admin reset password (PUT /api/users/:id/reset-password)
const resetPasswordAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword, password } = req.body;
        const plainPassword = newPassword || password;

        if (!plainPassword) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // Check if ID is student_ prefixed (like in getAllUsers)
        let userId = id;
        if (id.startsWith('student_')) {
            const studentId = id.replace('student_', '');
            const student = await Student.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            // Find corresponding User by email
            const user = await User.findOne({ where: { email: student.email } });
            if (!user) {
                return res.status(404).json({ error: 'User account for this student not found' });
            }
            userId = user.id;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        await user.update({ password: hashedPassword });

        await logActivity(
            req.user ? req.user.id : null,
            'Password Reset (Admin)',
            `Password for account "${user.name}" (${user.email}) was reset by Admin ${req.user ? req.user.name : 'System'}.`
        );

        res.json({
            success: true,
            message: 'Password reset successfully by administrator'
        });
    } catch (error) {
        console.error('Admin reset password error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUserStatus,
    resetPassword,
    searchStudents,
    resetPasswordAdmin
};