import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spin } from 'antd';
import { getDashboardRoute } from '../../utils/permissions';

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

  // Redirect based on user role using centralized utility
  if (currentUser) {
    const dashboardRoute = getDashboardRoute(currentUser.role);
    return <Navigate to={dashboardRoute} replace />;
  }

  // If no user, redirect to login
  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;

