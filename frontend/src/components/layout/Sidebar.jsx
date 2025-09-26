import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
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

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      permission: PERMISSIONS.DASHBOARD_VIEW,
    },
    {
      key: '/enquiries',
      icon: <FileAddOutlined />,
      label: 'Jobs',
      permission: PERMISSIONS.JOB_VIEW,
    },
    {
      key: '/clients',
      icon: <UserOutlined />,
      label: 'Clients',
      permission: PERMISSIONS.CUSTOMER_VIEW,
    },
    {
      key: '/invoices',
      icon: <FileTextOutlined />,
      label: 'Invoices',
      permission: PERMISSIONS.INVOICE_VIEW,
    },
    {
      key: '/accounting',
      icon: <CalculatorOutlined />,
      label: 'Accounting',
      permission: PERMISSIONS.EXPENSE_APPROVE, // Only admin and invoice officer can see full accounting
    },
    {
      key: '/requests',
      icon: <FileAddOutlined />,
      label: 'Requests',
      permission: PERMISSIONS.EXPENSE_CREATE, // Other roles can see requests tab
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      permission: PERMISSIONS.SETTINGS_VIEW,
    },
    {
      key: '/configuration',
      icon: <GlobalOutlined />,
      label: 'Configuration',
    },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // Show items without permission requirements
    return hasPermission(currentUser?.role, item.permission);
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
