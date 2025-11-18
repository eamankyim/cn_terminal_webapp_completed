import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UI_PERMISSIONS, hasUIPermission } from '../../utils/uiPermissions';
import { isEmployeeRole, shouldHideRequestsTab, hasRole } from '../../utils/permissions';
import PermissionGate from '../common/PermissionGate';
import {
  DashboardOutlined,
  FileAddOutlined,
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
  SettingOutlined,
  BarChartOutlined,
  ContainerOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, hasPermission } = useAuth();

  const handleMenuClick = (e) => {
    navigate(e.key);
    // Close mobile drawer after navigation
    if (onNavigate) {
      onNavigate();
    }
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      permission: UI_PERMISSIONS.DASHBOARD,
      // Only show Dashboard for ADMIN, ACCOUNTANT, and IT_CONSULTANT
      allowedRoles: ['ADMIN', 'ACCOUNTANT', 'IT_CONSULTANT'],
    },
    {
      key: '/enquiries',
      icon: <FileAddOutlined />,
      label: 'Jobs',
      permission: UI_PERMISSIONS.JOBS,
    },
    {
      key: '/clients',
      icon: <UserOutlined />,
      label: 'Clients',
      permission: UI_PERMISSIONS.CLIENTS,
    },
    {
      key: '/invoices',
      icon: <FileTextOutlined />,
      label: 'Invoices',
      permission: UI_PERMISSIONS.INVOICES,
    },
    {
      key: '/estimates',
      icon: <CalculatorOutlined />,
      label: 'Estimates',
      permission: UI_PERMISSIONS.ESTIMATES,
    },
    {
      key: '/accounting',
      icon: <CalculatorOutlined />,
      label: 'Accounting',
      permission: UI_PERMISSIONS.ACCOUNTING,
    },
    {
      key: '/requests',
      icon: <FileAddOutlined />,
      label: 'Requests',
      permission: UI_PERMISSIONS.REQUESTS,
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      permission: UI_PERMISSIONS.REPORTS,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      permission: UI_PERMISSIONS.SETTINGS,
    },
    {
      key: '/configuration',
      icon: <GlobalOutlined />,
      label: 'Configuration',
      permission: UI_PERMISSIONS.CONFIGURATION,
    },
  ];

  // Filter menu items based on user permissions and role restrictions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // Show items without permission requirements
    
    // Hide Dashboard for all roles except ADMIN, ACCOUNTANT, and IT_CONSULTANT
    if (item.key === '/dashboard') {
      const allowedRoles = item.allowedRoles || ['ADMIN', 'ACCOUNTANT', 'IT_CONSULTANT'];
      if (!allowedRoles.includes(currentUser?.role)) {
        return false;
      }
    }
    
    // Hide Requests tab for admin, accountant, and IT consultant users since they don't send requests
    if (item.key === '/requests' && shouldHideRequestsTab(currentUser?.role)) {
      return false;
    }
    
    // Hide Accounting tab for employee roles
    if (item.key === '/accounting' && isEmployeeRole(currentUser?.role)) {
        return false;
    }
    
    // Check if user has the permission in their database permissions
    if (currentUser?.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(item.permission);
    }
    
    // If no user permissions, don't show any restricted items
    // This prevents showing tabs that the user doesn't have access to
    return false;
  });

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="sidebar"
      width={250}
    >
      <div className="sidebar-container">
        {/* Logo Section */}
        <div className="sidebar-logo">
          {collapsed ? (
            <img 
              src="/cn_logo.png" 
              alt="CN Terminal" 
              style={{ 
                width: '32px', 
                height: '32px',
                objectFit: 'cover',
                borderRadius: '4px'
              }} 
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/cn_logo.png" 
                alt="CN Terminal" 
                style={{ 
                  width: '40px', 
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }} 
              />
              <span style={{ 
                color: 'white', 
                fontSize: '18px', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                CN Terminal
              </span>
            </div>
          )}
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={handleMenuClick}
          className="sidebar-menu"
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
