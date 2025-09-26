const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdminOrIT, PERMISSIONS } = require('../middleware/auth');
const { 
  getAllRoles, 
  getAllPermissions, 
  updateRolePermissions,
  grantUserPermission,
  revokeUserPermission,
  getUserPermissions
} = require('../utils/databasePermissions');

const router = express.Router();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all available roles and their permissions
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all roles with their permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         example: ADMIN
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["user:view", "user:create"]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or IT Consultant access required
 */
router.get('/', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const roles = await getAllRoles();
    
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions: role.rolePermissions.map(rp => rp.permission.name),
      permissionCount: role.rolePermissions.length,
      userCount: role._count.users,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    res.json({
      success: true,
      roles: formattedRoles,
      totalRoles: formattedRoles.length
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * @swagger
 * /api/roles/{role}/permissions:
 *   get:
 *     summary: Get permissions for a specific role
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, RELEASE_OFFICER, REVIEW_OFFICER, INVOICE_OFFICER, CLEARING_OFFICER, STAFF]
 *         description: Role name
 *     responses:
 *       200:
 *         description: Permissions for the specified role
 *       404:
 *         description: Role not found
 */
router.get('/:role/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!ROLE_PERMISSIONS[role]) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({
      success: true,
      role,
      permissions: ROLE_PERMISSIONS[role],
      permissionCount: ROLE_PERMISSIONS[role].length
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

/**
 * @swagger
 * /api/roles/{role}/permissions:
 *   put:
 *     summary: Update permissions for a specific role
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, RELEASE_OFFICER, REVIEW_OFFICER, INVOICE_OFFICER, CLEARING_OFFICER, STAFF]
 *         description: Role name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission strings
 *                 example: ["user:view", "user:create", "job:view"]
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
 *       400:
 *         description: Invalid permissions provided
 *       404:
 *         description: Role not found
 */
router.put('/:role/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!ROLE_PERMISSIONS[role]) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    // Validate that all permissions are valid
    const allValidPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = permissions.filter(perm => !allValidPermissions.includes(perm));
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid permissions provided',
        invalidPermissions 
      });
    }

    // Update the role permissions (in a real app, this would be stored in database)
    ROLE_PERMISSIONS[role] = permissions;

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      role,
      permissions,
      permissionCount: permissions.length
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get all available permissions
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all available permissions
 */
router.get('/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const permissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
      key,
      permission: value,
      category: value.split(':')[0]
    }));

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, perm) => {
      const category = perm.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      permissions: Object.values(permissions),
      permissionsByCategory,
      totalPermissions: permissions.length
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * @swagger
 * /api/roles/users/{userId}/role:
 *   put:
 *     summary: Update user's role
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, RELEASE_OFFICER, REVIEW_OFFICER, INVOICE_OFFICER, CLEARING_OFFICER, STAFF, DRIVER, WAREHOUSE]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       404:
 *         description: User not found
 */
router.put('/users/:userId/role', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = Object.keys(ROLE_PERMISSIONS);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser,
      newRole: role,
      newPermissions: ROLE_PERMISSIONS[role]
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get all available permissions
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all available permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       module:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or IT Consultant access required
 */
router.get('/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const permissions = await getAllPermissions();
    
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * @swagger
 * /api/roles/{roleId}/permissions:
 *   put:
 *     summary: Update role permissions
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission IDs
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or IT Consultant access required
 *       404:
 *         description: Role not found
 */
router.put('/:roleId/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;
    
    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds must be an array' });
    }
    
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if role is system role (can't be modified)
    if (role.isSystem) {
      return res.status(403).json({ error: 'Cannot modify system role permissions' });
    }
    
    await updateRolePermissions(roleId, permissionIds, req.user.id);
    
    res.json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

/**
 * @swagger
 * /api/roles/users/{userId}/permissions:
 *   get:
 *     summary: Get user permissions
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or IT Consultant access required
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const permissions = await getUserPermissions(userId);
    
    res.json({
      success: true,
      user,
      permissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

/**
 * @swagger
 * /api/roles/users/{userId}/permissions:
 *   post:
 *     summary: Grant permission to user
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionId:
 *                 type: string
 *                 description: Permission ID
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       200:
 *         description: Permission granted successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or IT Consultant access required
 *       404:
 *         description: User or permission not found
 */
router.post('/users/:userId/permissions', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissionId, expiresAt } = req.body;
    
    if (!permissionId) {
      return res.status(400).json({ error: 'permissionId is required' });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });
    
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
    
    await grantUserPermission(userId, permissionId, req.user.id, expiresAtDate);
    
    res.json({
      success: true,
      message: 'Permission granted successfully'
    });
  } catch (error) {
    console.error('Error granting user permission:', error);
    res.status(500).json({ error: 'Failed to grant permission' });
  }
});

/**
 * @swagger
 * /api/roles/users/{userId}/permissions/{permissionId}:
 *   delete:
 *     summary: Revoke permission from user
 *     tags: [Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission revoked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or IT Consultant access required
 *       404:
 *         description: User or permission not found
 */
router.delete('/users/:userId/permissions/:permissionId', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });
    
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    await revokeUserPermission(userId, permissionId);
    
    res.json({
      success: true,
      message: 'Permission revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking user permission:', error);
    res.status(500).json({ error: 'Failed to revoke permission' });
  }
});

module.exports = router;
