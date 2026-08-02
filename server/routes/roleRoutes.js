'use strict';
const express = require('express');
const router = express.Router();
const { authenticateToken, adminMiddleware } = require('../middleware/auth');
const roleController = require('../controllers/roleController');

// GET /api/roles — All authenticated users can fetch roles (so frontend can read permissions)
router.get('/', authenticateToken, roleController.getRoles);

// POST /api/roles — Only admin can create custom roles
router.post('/', authenticateToken, adminMiddleware, roleController.createRole);

// PUT /api/roles/:id/permissions — Only admin can update permissions
router.put('/:id/permissions', authenticateToken, adminMiddleware, roleController.updateRolePermissions);

// DELETE /api/roles/:id — Only admin can delete custom roles
router.delete('/:id', authenticateToken, adminMiddleware, roleController.deleteRole);

module.exports = router;
