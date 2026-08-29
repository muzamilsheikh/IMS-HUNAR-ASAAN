'use strict';
const { Role } = require('../models');

// Default permission keys and their full set for admin
const ALL_PERMISSIONS = {
    // Students Management
    viewStudentList: false,
    addStudent: false,
    editDeleteStudent: false,
    // Financials & Challans
    viewChallans: false,
    processPayments: false,
    manageExpenses: false,
    viewPayroll: false,
    // Academics & Operations
    viewCreateBatches: false,
    viewManageCourses: false,
    liveClassAccess: false,
    videoVaultAdmin: false,
    // Reports & System Control
    accessReports: false,
    accessSettings: false,
    backupRestore: false,
    // Users management
    manageUsers: false,
    // Calendar
    viewCalendar: false,
    // Chat
    viewChat: false,
};

const ADMIN_ALL_PERMISSIONS = Object.fromEntries(Object.keys(ALL_PERMISSIONS).map(k => [k, true]));

// Default permission sets for built-in roles
const BUILT_IN_ROLE_PERMISSIONS = {
    admin: ADMIN_ALL_PERMISSIONS,
    Admin: ADMIN_ALL_PERMISSIONS,
    manager: {
        ...ALL_PERMISSIONS,
        viewStudentList: true, addStudent: true, editDeleteStudent: true,
        viewChallans: true, processPayments: true, manageExpenses: true, viewPayroll: true,
        viewCreateBatches: true, viewManageCourses: true, liveClassAccess: true,
        accessReports: true, viewCalendar: true, viewChat: true,
    },
    accounts_manager: {
        ...ALL_PERMISSIONS,
        viewStudentList: true, viewChallans: true, processPayments: true,
        manageExpenses: true, viewPayroll: true, viewCreateBatches: true,
        viewManageCourses: true, accessReports: true, viewCalendar: true,
    },
    staff: {
        ...ALL_PERMISSIONS,
        viewCalendar: true, liveClassAccess: true, viewChat: true,
    },
    student: {
        ...ALL_PERMISSIONS,
        viewCalendar: true, liveClassAccess: true, viewChat: true, viewChallans: true,
    },
};

/**
 * GET /api/roles
 * Returns all roles (seeded + custom), merging built-in defaults with DB records
 */
exports.getRoles = async (req, res) => {
    try {
        const dbRoles = await Role.findAll({ order: [['id', 'ASC']] });

        const roles = dbRoles.map(r => {
            let perms;
            try { perms = JSON.parse(r.permissions); } catch { perms = {}; }

            // Merge with built-in if exists, otherwise use stored
            const builtIn = BUILT_IN_ROLE_PERMISSIONS[r.name.toLowerCase()] || {};
            const merged = { ...ALL_PERMISSIONS, ...builtIn, ...perms };

            return {
                id: r.id,
                name: r.name,
                isSystem: ['Admin', 'Manager', 'accounts_manager', 'Staff', 'Student'].map(n => n.toLowerCase()).includes(r.name.toLowerCase()),
                permissions: merged,
                createdAt: r.createdAt,
            };
        });

        res.json(roles);
    } catch (err) {
        console.error('getRoles error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch roles' });
    }
};

/**
 * POST /api/roles
 * Create a new custom role
 */
exports.createRole = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        // Prevent duplicate
        const existing = await Role.findOne({ where: { name: name.trim() } });
        if (existing) {
            return res.status(409).json({ error: 'A role with this name already exists' });
        }

        const role = await Role.create({
            name: name.trim(),
            permissions: JSON.stringify(ALL_PERMISSIONS),
        });

        res.status(201).json({
            id: role.id,
            name: role.name,
            isSystem: false,
            permissions: ALL_PERMISSIONS,
        });
    } catch (err) {
        console.error('createRole error:', err);
        res.status(500).json({ error: err.message || 'Failed to create role' });
    }
};

/**
 * PUT /api/roles/:id/permissions
 * Update permissions for a role
 */
exports.updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!permissions || typeof permissions !== 'object') {
            return res.status(400).json({ error: 'Permissions object is required' });
        }

        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Merge known keys only (prevent injection of unknown keys)
        const safe = {};
        for (const key of Object.keys(ALL_PERMISSIONS)) {
            safe[key] = permissions[key] === true;
        }

        await role.update({ permissions: JSON.stringify(safe) });

        res.json({
            id: role.id,
            name: role.name,
            permissions: safe,
        });
    } catch (err) {
        console.error('updateRolePermissions error:', err);
        res.status(500).json({ error: err.message || 'Failed to update role permissions' });
    }
};

/**
 * DELETE /api/roles/:id
 * Delete a custom role (system roles cannot be deleted)
 */
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const systemRoles = ['admin', 'manager', 'accounts_manager', 'staff', 'student'];
        if (systemRoles.includes(role.name.toLowerCase())) {
            return res.status(403).json({ error: 'System roles cannot be deleted' });
        }

        await role.destroy();
        res.json({ message: `Role "${role.name}" deleted successfully` });
    } catch (err) {
        console.error('deleteRole error:', err);
        res.status(500).json({ error: err.message || 'Failed to delete role' });
    }
};
