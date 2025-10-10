const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { hasPermission, hasAnyPermission, hasAllPermissions, PERMISSIONS } = require('../utils/permissions');

/**
 * Check if user has a specific permission through role or direct assignment
 */
async function checkUserPermission(userId, permissionName) {
  try {
    // First, get the permission ID
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {

      return false;
    }

    // Check if user has permission through role
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        permissionId: permission.id,
        role: {
          users: {
            some: { id: userId }
          }
        }
      }
    });

    if (rolePermission) {
      return true;
    }

    // Check if user has permission through direct assignment
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId: userId,
        permissionId: permission.id
      }
    });

    return !!userPermission;
  } catch (error) {

    return false;
  }
}

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to require staff role or higher
 */
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const allowedRoles = ['STAFF', 'ADMIN'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff access required' });
  }

  next();
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Middleware to require specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Check if user has permission through role or direct assignment
      const hasPermission = await checkUserPermission(req.user.id, permission);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          userRole: req.user.role
        });
      }
      
      next();
    } catch (error) {

      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to require any of the specified permissions
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const permissionChecks = await Promise.all(
        permissions.map(permission => checkUserPermission(req.user.id, permission))
      );
      
      const hasAny = permissionChecks.some(hasPermission => hasPermission);
      
      if (!hasAny) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissions,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {

      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to require all specified permissions
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const permissionChecks = await Promise.all(
        permissions.map(permission => checkUserPermission(req.user.id, permission))
      );
      
      const hasAll = permissionChecks.every(hasPermission => hasPermission);
      
      if (!hasAll) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissions,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {

      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to require admin or IT consultant role
 */
const requireAdminOrIT = (req, res, next) => {

  if (!req.user) {

    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!['ADMIN', 'IT_CONSULTANT'].includes(req.user.role)) {

    return res.status(403).json({ error: 'Admin or IT Consultant access required' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireStaff,
  requireAdmin,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdminOrIT,
  PERMISSIONS
};