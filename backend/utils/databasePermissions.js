const { prisma } = require('../config/database');

// Cache for permissions to avoid repeated database queries
let permissionsCache = new Map();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get user permissions from database (with caching)
 */
async function getUserPermissions(userId) {
  const now = Date.now();
  
  // Check cache first
  if (permissionsCache.has(userId) && now < cacheExpiry) {
    return permissionsCache.get(userId);
  }
  
  try {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return [];
    }
    
    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: { name: user.role } },
      include: { permission: true }
    });
    
    // Get user-specific permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: { 
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: { permission: true }
    });
    
    // Combine permissions
    const permissions = [
      ...rolePermissions.map(rp => rp.permission.name),
      ...userPermissions.map(up => up.permission.name)
    ];
    
    // Remove duplicates
    const uniquePermissions = [...new Set(permissions)];
    
    // Cache the result
    permissionsCache.set(userId, uniquePermissions);
    cacheExpiry = now + CACHE_DURATION;
    
    return uniquePermissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user has specific permission
 */
async function hasPermission(userId, requiredPermission) {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
async function hasAnyPermission(userId, requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) {
    return hasPermission(userId, requiredPermissions);
  }
  
  const permissions = await getUserPermissions(userId);
  return requiredPermissions.some(permission => permissions.includes(permission));
}

/**
 * Check if user has all required permissions
 */
async function hasAllPermissions(userId, requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) {
    return hasPermission(userId, requiredPermissions);
  }
  
  const permissions = await getUserPermissions(userId);
  return requiredPermissions.every(permission => permissions.includes(permission));
}

/**
 * Get all available permissions
 */
async function getAllPermissions() {
  try {
    return await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
  } catch (error) {
    console.error('Error getting all permissions:', error);
    return [];
  }
}

/**
 * Get all roles with their permissions
 */
async function getAllRoles() {
  try {
    console.log('🔍 DATABASE PERMISSIONS - Fetching all roles from database...');
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        rolePermissions: {
          include: { permission: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    console.log('🔍 DATABASE PERMISSIONS - Found roles:', roles.length);
    console.log('🔍 DATABASE PERMISSIONS - Roles data:', JSON.stringify(roles, null, 2));
    return roles;
  } catch (error) {
    console.error('❌ DATABASE PERMISSIONS - Error getting all roles:', error);
    return [];
  }
}

/**
 * Update role permissions
 */
async function updateRolePermissions(roleId, permissionIds, updatedBy) {
  try {
    await prisma.$transaction(async (tx) => {
      // Remove existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });
      
      // Add new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId,
            permissionId,
            createdBy: updatedBy
          }))
        });
      }
    });
    
    // Clear cache
    permissionsCache.clear();
    
    return true;
  } catch (error) {
    console.error('Error updating role permissions:', error);
    throw error;
  }
}

/**
 * Grant permission to user
 */
async function grantUserPermission(userId, permissionId, grantedBy, expiresAt = null) {
  try {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      update: {
        isActive: true,
        expiresAt,
        grantedBy
      },
      create: {
        userId,
        permissionId,
        grantedBy,
        expiresAt
      }
    });
    
    // Clear cache for this user
    permissionsCache.delete(userId);
    
    return true;
  } catch (error) {
    console.error('Error granting user permission:', error);
    throw error;
  }
}

/**
 * Revoke permission from user
 */
async function revokeUserPermission(userId, permissionId) {
  try {
    await prisma.userPermission.updateMany({
      where: {
        userId,
        permissionId
      },
      data: {
        isActive: false
      }
    });
    
    // Clear cache for this user
    permissionsCache.delete(userId);
    
    return true;
  } catch (error) {
    console.error('Error revoking user permission:', error);
    throw error;
  }
}

/**
 * Clear permissions cache
 */
function clearPermissionsCache() {
  permissionsCache.clear();
  cacheExpiry = 0;
}

module.exports = {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  getAllRoles,
  updateRolePermissions,
  grantUserPermission,
  revokeUserPermission,
  clearPermissionsCache
};


