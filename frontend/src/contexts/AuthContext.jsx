import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService, { clearSessionExpiredFlag } from '../services/api';
import invitationService from '../services/invitationService';
import { hasUIPermission } from '../utils/uiPermissions';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock user data removed - now using real API

  // Pending invites - loaded from API
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('cn_terminal_user');
    const savedToken = localStorage.getItem('cn_terminal_token');
    
    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        apiService.setToken(savedToken);
        
        // Note: User permissions will be auto-refreshed in a separate useEffect
        
        // Load pending invitations if user is admin
        if (user.role === 'ADMIN') {
          loadPendingInvitations();
        }
      } catch (error) {
        localStorage.removeItem('cn_terminal_user');
        localStorage.removeItem('cn_terminal_token');
      }
    }
    setLoading(false);
  }, []);

  // Auto-refresh user permissions when app starts (if user is logged in)
  // This will be handled after the refreshUserPermissions function is defined

  // Load pending invitations from API
  const loadPendingInvitations = async () => {
    try {
      const response = await invitationService.getPendingInvitations();
      setPendingInvites(response.invitations || []);
    } catch (error) {
      setPendingInvites([]);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.user && response.token) {
        clearSessionExpiredFlag();
        // Set user in state and localStorage
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('cn_terminal_user', JSON.stringify(response.user));
        localStorage.setItem('cn_terminal_token', response.token);
        apiService.setToken(response.token);
        
        // Load pending invitations if user is admin
        if (response.user.role === 'ADMIN') {
          loadPendingInvitations();
        }
        
        return { success: true, user: response.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearSessionExpiredFlag();
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('cn_terminal_user');
    localStorage.removeItem('cn_terminal_token');
    apiService.setToken(null);
  };

  // Admin function to send invites
  const sendInvite = async (inviteData) => {
    try {
      // Use the invitation service to send invite via API
      const response = await invitationService.sendInvitation(inviteData);
      
      // Update local state - response contains the API response data
      if (response && response.invitation) {
        setPendingInvites(prev => {
          // Check if invitation already exists to prevent duplicates
          const exists = prev.some(invite => invite.id === response.invitation.id);
          if (exists) {
            return prev;
          }
          return [...prev, response.invitation];
        });
        
        // Email is automatically sent by the backend API
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Function to accept invite and create user account
  const acceptInvite = async (inviteId, userData) => {
    try {
      // Use the invitation service to accept invite via API
      const response = await invitationService.acceptInvitation(inviteId, userData);
      
      // Remove invite from pending list
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      
      // Welcome email is automatically sent by the backend API
      
      return { success: true, user: response.user };
    } catch (error) {
      throw error;
    }
  };

  // Helper function to get permissions for a role
  const getPermissionsForRole = (role) => {
    switch (role) {
      case 'ADMIN':
        return ['all'];
      case 'STAFF':
        return ['enquiry-management', 'document-upload', 'client-communication', 'validation', 'duty-calculation', 'invoicing', 'payment-tracking'];
      case 'DRIVER':
        return ['delivery-management', 'package-tracking', 'route-optimization'];
      case 'WAREHOUSE':
        return ['inventory-management', 'package-handling', 'storage-optimization'];
      default:
        return ['basic-access'];
    }
  };

  const updateProfile = async (updates) => {
    try {
      // Combine first and last name if provided separately
      const profileUpdates = { ...updates };
      if (updates.firstName || updates.lastName) {
        profileUpdates.name = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
        delete profileUpdates.firstName;
        delete profileUpdates.lastName;
      }
      
      // Call the API to update profile
      const response = await apiService.put('/auth/profile', profileUpdates);
      
      if (response.user) {
        const updatedUser = response.user;
        setCurrentUser(updatedUser);
        localStorage.setItem('cn_terminal_user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) {
      return false;
    }

    // Bidirectional aliases so ui:* and resource:* checks both work
    const aliases = {
      'customer:create': ['ui:create_customer'],
      'ui:create_customer': ['customer:create'],
      'customer:edit': ['ui:edit_customer'],
      'ui:edit_customer': ['customer:edit'],
      'customer:delete': ['ui:delete_customer'],
      'ui:delete_customer': ['customer:delete'],
      'customer:view_all': ['ui:view_all_customers', 'ui:clients'],
      'ui:view_all_customers': ['customer:view_all', 'ui:clients'],
      'ui:clients': ['customer:view', 'customer:view_all'],
      'customer:view': ['ui:clients'],
      'job:update_status': ['ui:update_job_status'],
      'ui:update_job_status': ['job:update_status'],
      'job:assign': ['ui:assign_job'],
      'ui:assign_job': ['job:assign'],
      'job:edit': ['ui:edit_job'],
      'ui:edit_job': ['job:edit'],
      'expense:request': ['ui:requests'],
      'ui:requests': ['expense:request'],
      'estimate:create': ['ui:create_estimate'],
      'ui:create_estimate': ['estimate:create'],
      'cashflow:create': ['ui:create_cashflow'],
      'ui:create_cashflow': ['cashflow:create'],
    };

    const candidates = [permission, ...(aliases[permission] || [])];

    // Check if user has specific permissions array from database
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      if (candidates.some((p) => currentUser.permissions.includes(p))) {
        return true;
      }
    }

    // Fallback to UI-based permissions
    return candidates.some((p) => hasUIPermission(currentUser.role, p));
  };

  // Function to refresh user permissions from the server
  const refreshUserPermissions = async () => {
    try {
      const response = await apiService.get('/auth/me');
      
      if (response && response.user) {
        const updatedUser = {
          ...currentUser,
          permissions: response.user.permissions || []
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('cn_terminal_user', JSON.stringify(updatedUser));
        
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  // Auto-refresh user permissions once when app starts (if user is logged in)
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      refreshUserPermissions();
    }
    // Intentionally only when auth identity changes — not on every currentUser mutation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.id]);

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    sendInvite,
    acceptInvite,
    pendingInvites,
    loadPendingInvitations,
    updateProfile,
    hasPermission,
    refreshUserPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
