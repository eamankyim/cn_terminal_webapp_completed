import React from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../utils/permissions';
import { hasUIPermission, hasAnyUIPermission, hasAllUIPermissions } from '../../utils/uiPermissions';

/**
 * PermissionGate component - Conditionally renders children based on user permissions
 * 
 * @param {string} userRole - Current user's role (legacy support)
 * @param {string[]} userPermissions - Current user's permissions array from API
 * @param {string|string[]} permissions - Required permission(s)
 * @param {string} mode - 'any' (default) or 'all' - whether user needs any or all permissions
 * @param {React.ReactNode} children - Content to render if permission is granted
 * @param {React.ReactNode} fallback - Content to render if permission is denied
 * @param {boolean} showFallback - Whether to show fallback content (default: false)
 */
const PermissionGate = ({
  userRole,
  userPermissions,
  permissions,
  mode = 'any',
  children,
  fallback = null,
  showFallback = false
}) => {
  if ((!userRole && !userPermissions) || !permissions) {
    return showFallback ? fallback : null;
  }

  let hasAccess = false;

  // If userPermissions is provided, use the new permission system
  if (userPermissions && Array.isArray(userPermissions)) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    if (mode === 'all') {
      hasAccess = requiredPermissions.every(perm => userPermissions.includes(perm));
    } else {
      hasAccess = requiredPermissions.some(perm => userPermissions.includes(perm));
    }
  } else {
    // Fallback to old role-based system for backward compatibility
    const isUIPermission = (perm) => typeof perm === 'string' && perm.startsWith('ui:');
    const isUIPermissions = Array.isArray(permissions) 
      ? permissions.every(isUIPermission)
      : isUIPermission(permissions);

    if (Array.isArray(permissions)) {
      hasAccess = mode === 'all' 
        ? (isUIPermissions ? hasAllUIPermissions(userRole, permissions) : hasAllPermissions(userRole, permissions))
        : (isUIPermissions ? hasAnyUIPermission(userRole, permissions) : hasAnyPermission(userRole, permissions));
    } else {
      hasAccess = isUIPermissions 
        ? hasUIPermission(userRole, permissions)
        : hasPermission(userRole, permissions);
    }
  }

  if (hasAccess) {
    return children;
  }

  return showFallback ? fallback : null;
};

export default PermissionGate;

