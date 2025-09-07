import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

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

  // Mock user data for demo purposes (clearing agent users)
  const mockUsers = [
    {
      id: 1,
      email: 'admin@cnterminal.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      avatar: null, // No avatar to test initials
      permissions: ['all'],
      status: 'active',
      invitedBy: null,
      invitedAt: null,
      onboardedAt: '2024-01-01'
    },
    {
      id: 2,
      email: 'staff1@cnterminal.com',
      password: 'staff123',
      name: 'John Staff',
      role: 'staff1',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff1',
      permissions: ['enquiry-management', 'document-upload', 'client-communication'],
      status: 'active',
      invitedBy: 'admin@cnterminal.com',
      invitedAt: '2024-01-05',
      onboardedAt: '2024-01-06'
    },
    {
      id: 3,
      email: 'staff2@cnterminal.com',
      password: 'staff123',
      name: 'Sarah Finance',
      role: 'staff2',
      avatar: null, // No avatar to test initials
      permissions: ['validation', 'duty-calculation', 'invoicing', 'payment-tracking'],
      status: 'active',
      invitedBy: 'admin@cnterminal.com',
      invitedAt: '2024-01-03',
      onboardedAt: '2024-01-04'
    },

    {
      id: 5,
      email: 'finance@cnterminal.com',
      password: 'finance123',
      name: 'Emma Finance',
      role: 'finance',
      avatar: null, // Single name to test initials
      permissions: ['financial-reports', 'payment-reconciliation', 'cost-analysis'],
      status: 'active',
      invitedBy: 'admin@cnterminal.com',
      invitedAt: '2024-01-01',
      onboardedAt: '2024-01-02'
    }
  ];

  // Mock pending invites
  const [pendingInvites, setPendingInvites] = useState([
    {
      id: 'invite_001',
      email: 'newdriver@shipease.com',
      role: 'driver',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-20',
      expiresAt: '2024-01-27',
      status: 'pending'
    },
    {
      id: 'invite_002',
      email: 'accountant@shipease.com',
      role: 'finance',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-19',
      expiresAt: '2024-01-26',
      status: 'pending'
    }
  ]);

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
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('cn_terminal_user');
        localStorage.removeItem('cn_terminal_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.user && response.token) {
        // Set user in state and localStorage
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('cn_terminal_user', JSON.stringify(response.user));
        
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === inviteData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Check if invite already exists
      const existingInvite = pendingInvites.find(inv => inv.email === inviteData.email);
      if (existingInvite) {
        throw new Error('Invite already sent to this email');
      }
      
      // Create new invite
      const newInvite = {
        id: `invite_${Date.now()}`,
        email: inviteData.email,
        role: inviteData.role,
        invitedBy: currentUser?.email || 'admin@shipease.com',
        invitedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
        status: 'pending'
      };
      
      // Add to pending invites
      setPendingInvites(prev => [...prev, newInvite]);
      
      // In real app, this would send an email
      console.log('Invite sent:', newInvite);
      
      return { success: true, invite: newInvite };
    } catch (error) {
      throw error;
    }
  };

  // Function to accept invite and create user account
  const acceptInvite = async (inviteId, userData) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the invite
      const invite = pendingInvites.find(inv => inv.id === inviteId);
      if (!invite) {
        throw new Error('Invite not found or expired');
      }
      
      // Check if invite is expired
      if (new Date(invite.expiresAt) < new Date()) {
        throw new Error('Invite has expired');
      }
      
      // Create new user
      const newUser = {
        id: mockUsers.length + 1,
        email: invite.email,
        password: userData.password,
        name: userData.name,
        role: invite.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
        permissions: getPermissionsForRole(invite.role),
        status: 'active',
        invitedBy: invite.invitedBy,
        invitedAt: invite.invitedAt,
        onboardedAt: new Date().toISOString().split('T')[0]
      };
      
      // Remove invite from pending list
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      
      // In real app, this would add the user to the database
      console.log('User created from invite:', newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      throw error;
    }
  };

  // Helper function to get permissions for a role
  const getPermissionsForRole = (role) => {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'staff1':
        return ['enquiry-management', 'document-upload', 'client-communication'];
      case 'staff2':
        return ['validation', 'duty-calculation', 'invoicing', 'payment-tracking'];

      case 'finance':
        return ['financial-reports', 'payment-reconciliation', 'cost-analysis'];
      default:
        return ['basic-access'];
    }
  };

  const updateProfile = async (updates) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('shipease_user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return currentUser.permissions.includes('all') || currentUser.permissions.includes(permission);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    sendInvite,
    acceptInvite,
    pendingInvites,
    updateProfile,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
