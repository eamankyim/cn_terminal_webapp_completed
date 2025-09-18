import React, { useState } from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Menu, Badge } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  BellOutlined, 
  LogoutOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import './MainLayout.css';

const { Header, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Mock notification count - in real app this would come from API
  const notificationCount = 3;

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const handleNotificationClick = () => {
    // In real app, this would open a notification panel or navigate to notifications
    console.log('Notifications clicked - count:', notificationCount);
    // You could navigate to a notifications page or open a dropdown
    // navigate('/notifications');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/admin')}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/admin')}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      
      <Layout className={`content-layout ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            
            <Space size="large">
              {/* Notifications with badge attached to bell */}
              <Badge count={notificationCount} size="small" offset={[-5, 5]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={handleNotificationClick}
                  className="notification-button"
                  style={{
                    fontSize: '18px',
                    width: 48,
                    height: 48,
                  }}
                />
              </Badge>
              
              {/* User Profile with initials fallback */}
              <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={currentUser?.avatar} 
                    size="large"
                    className="user-avatar"
                    style={{
                      backgroundColor: currentUser?.avatar ? undefined : '#1890ff',
                      color: currentUser?.avatar ? undefined : '#fff',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    {currentUser?.avatar ? undefined : getUserInitials(currentUser?.name)}
                  </Avatar>
                  <span style={{ color: '#000', fontWeight: 500 }}>
                    {currentUser?.name || 'User'}
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
