import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
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
    
    console.log('🔐 Auth Check - Saved User:', savedUser);
    console.log('🔐 Auth Check - Saved Token:', savedToken ? 'Present' : 'Missing');
    
    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        console.log('🔐 Auth Check - Parsed User:', user);
        setCurrentUser(user);
        setIsAuthenticated(true);
        apiService.setToken(savedToken);
        
        // Note: User permissions will be auto-refreshed in a separate useEffect
        
        // Load pending invitations if user is admin
        if (user.role === 'ADMIN') {
          console.log('🔐 Auth Check - User is ADMIN, loading invitations...');
          loadPendingInvitations();
        } else {
          console.log('🔐 Auth Check - User is not ADMIN, role:', user.role);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('cn_terminal_user');
        localStorage.removeItem('cn_terminal_token');
      }
    } else {
      console.log('🔐 Auth Check - No saved user or token found');
    }
    setLoading(false);
  }, []);

  // Auto-refresh user permissions when app starts (if user is logged in)
  // This will be handled after the refreshUserPermissions function is defined

  // Load pending invitations from API
  const loadPendingInvitations = async () => {
    try {
      console.log('🔐 Loading pending invitations...');
      console.log('🔐 Current user:', currentUser);
      console.log('🔐 Is authenticated:', isAuthenticated);
      console.log('🔐 Token present:', !!apiService.token);
      
      const response = await invitationService.getPendingInvitations();
      setPendingInvites(response.invitations || []);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
      setPendingInvites([]);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.user && response.token) {
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
            console.log('📧 Invitation already exists in state, skipping duplicate');
            return prev;
          }
          return [...prev, response.invitation];
        });
        
        // Email is automatically sent by the backend API
        console.log('📧 Invitation created and email sent by backend');
      } else {
        console.warn('No invitation data in response:', response);
      }
      
      return response;
    } catch (error) {
      console.error('Send invite error:', error);
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
      console.log('📧 User account created and welcome email sent by backend');
      
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
      console.log('❌ hasPermission: No currentUser');
      return false;
    }
    
    // Check if user has specific permissions array from database
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      const hasPermissionResult = currentUser.permissions.includes(permission);
      console.log(`🔍 hasPermission(${permission}):`, hasPermissionResult, '| User permissions count:', currentUser.permissions.length);
      return hasPermissionResult;
    }
    
    // Fallback to UI-based permissions
    const fallbackResult = hasUIPermission(currentUser.role, permission);
    console.log(`🔍 hasPermission(${permission}) [FALLBACK]:`, fallbackResult, '| Role:', currentUser.role);
    return fallbackResult;
  };

  // Function to refresh user permissions from the server
  const refreshUserPermissions = async () => {
    try {
      console.log('🔄 Refreshing user permissions...');
      const response = await apiService.get('/auth/me');
      
      if (response && response.user) {
        const updatedUser = {
          ...currentUser,
          permissions: response.user.permissions || []
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('cn_terminal_user', JSON.stringify(updatedUser));
        
        console.log('✅ User permissions refreshed:', updatedUser.permissions);
        console.log('📊 Total permissions count:', updatedUser.permissions.length);
        console.log('🔍 Has dashboard permission:', updatedUser.permissions.includes('ui:dashboard'));
        console.log('🔍 Has job edit permission:', updatedUser.permissions.includes('job:edit'));
        
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to refresh user permissions:', error);
      return false;
    }
  };

  // Auto-refresh user permissions when app starts (if user is logged in)
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      console.log('🔄 Auto-refreshing user permissions on app start...');
      refreshUserPermissions().then(success => {
        if (success) {
          console.log('✅ User permissions auto-refreshed successfully');
        } else {
          console.log('⚠️ Failed to auto-refresh user permissions');
        }
      });
    }
  }, [isAuthenticated, currentUser]);

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
