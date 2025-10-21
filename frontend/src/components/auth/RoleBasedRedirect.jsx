import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spin } from 'antd';

const RoleBasedRedirect = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Redirect based on user role
  if (currentUser) {
    // ENQUIRY_OFFICER and ENTRY_OFFICER go to Jobs page (their main page)
    if (currentUser.role === 'ENQUIRY_OFFICER' || currentUser.role === 'ENTRY_OFFICER') {
      return <Navigate to="/enquiries" replace />;
    }
    
    // All other roles go to Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If no user, redirect to login
  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;

