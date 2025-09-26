import React from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../utils/permissions';

/**
 * PermissionGate component - Conditionally renders children based on user permissions
 * 
 * @param {string} userRole - Current user's role
 * @param {string|string[]} permissions - Required permission(s)
 * @param {string} mode - 'any' (default) or 'all' - whether user needs any or all permissions
 * @param {React.ReactNode} children - Content to render if permission is granted
 * @param {React.ReactNode} fallback - Content to render if permission is denied
 * @param {boolean} showFallback - Whether to show fallback content (default: false)
 */
const PermissionGate = ({
  userRole,
  permissions,
  mode = 'any',
  children,
  fallback = null,
  showFallback = false
}) => {
  if (!userRole || !permissions) {
    return showFallback ? fallback : null;
  }

  let hasAccess = false;

  if (Array.isArray(permissions)) {
    hasAccess = mode === 'all' 
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
  } else {
    hasAccess = hasPermission(userRole, permissions);
  }

  if (hasAccess) {
    return children;
  }

  return showFallback ? fallback : null;
};

export default PermissionGate;


