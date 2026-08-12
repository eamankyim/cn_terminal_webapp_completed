import React, { useState } from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Menu, Drawer, Tooltip, message } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useResponsive from '../../hooks/useResponsive';
import Sidebar from './Sidebar';
import NotificationBell from '../common/NotificationBell';
// import WhatsAppButton from '../common/WhatsAppButton';
import './MainLayout.css';

const { Header, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hardRefreshing, setHardRefreshing] = useState(false);
  const { currentUser, logout, refreshUserPermissions } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefreshPermissions = async () => {
    const success = await refreshUserPermissions();
    if (success) {
      // Show success message and reload the page to reflect changes
      window.location.reload();
    }
  };

  /** Hard refresh: clear Cache Storage then force a full page reload. */
  const handleHardRefresh = async () => {
    if (hardRefreshing) return;
    setHardRefreshing(true);
    message.loading({ content: 'Refreshing…', key: 'hard-refresh', duration: 0 });
    try {
      if (typeof caches !== 'undefined' && caches?.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (_) {
      // non-blocking — still reload
    } finally {
      message.destroy('hard-refresh');
      // Full navigation reload (bypasses SPA soft state)
      window.location.reload();
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/settings?tab=profile')}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        Settings
      </Menu.Item>
      <Menu.Item key="refresh" icon={<ReloadOutlined />} onClick={handleRefreshPermissions}>
        Refresh Permissions
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle desktop sidebar toggle
  const handleSidebarToggle = () => {
    setCollapsed(!collapsed);
  };

  // Close mobile menu when clicking outside
  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar collapsed={collapsed} />}
      
      {/* Mobile Sidebar Drawer */}
      <Drawer
        title="CN Terminal"
        placement="left"
        closable={true}
        onClose={handleMobileMenuClose}
        open={mobileMenuOpen}
        width={250}
        bodyStyle={{ padding: 0 }}
      >
        <Sidebar collapsed={false} onNavigate={handleMobileMenuClose} />
      </Drawer>
      
      <Layout className={`content-layout ${isMobile ? 'mobile-layout' : (collapsed ? 'sidebar-collapsed' : 'sidebar-expanded')}`}>
        <Header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Button
              type="text"
              icon={isMobile 
                ? (mobileMenuOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
                : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
              }
              onClick={isMobile ? handleMobileMenuToggle : handleSidebarToggle}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            
            <Space size="middle">
              <Tooltip title="Hard refresh">
                <Button
                  type="text"
                  icon={<ReloadOutlined spin={hardRefreshing} />}
                  onClick={handleHardRefresh}
                  loading={hardRefreshing}
                  aria-label="Hard refresh"
                  style={{
                    fontSize: '18px',
                    width: 40,
                    height: 40,
                    color: '#666',
                  }}
                />
              </Tooltip>

              {/* Real-time Notifications */}
              <NotificationBell />
              
              {/* User Profile with initials fallback */}
              <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={currentUser?.avatar} 
                    size={isMobile ? "default" : "large"}
                    className="user-avatar"
                    style={{
                      backgroundColor: currentUser?.avatar ? undefined : '#1890ff',
                      color: currentUser?.avatar ? undefined : '#fff',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '14px' : '16px'
                    }}
                  >
                    {currentUser?.avatar ? undefined : getUserInitials(currentUser?.name)}
                  </Avatar>
                  {!isMobile && (
                  <span style={{ color: '#000', fontWeight: 500 }}>
                    {currentUser?.name || 'User'}
                  </span>
                  )}
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
      
      {/* WhatsApp Floating Button */}
      {/* <WhatsAppButton /> */}
    </Layout>
  );
};

export default MainLayout;
