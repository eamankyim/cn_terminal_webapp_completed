import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  SESSION_EXPIRED_EVENT,
  clearSessionExpiredFlag,
} from '../../services/api';

/**
 * Shown when the API returns 401 (expired/invalid token).
 * Asks the user to log out and sign in again instead of leaving pages in a broken "Failed to load" state.
 */
const SessionExpiredModal = () => {
  const [open, setOpen] = useState(false);
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = () => {
      if (!isAuthenticated) return;
      setOpen(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      clearSessionExpiredFlag();
    }
  }, [isAuthenticated]);

  const handleRelogin = () => {
    setOpen(false);
    clearSessionExpiredFlag();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Modal
      open={open}
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Session expired
        </span>
      }
      okText="Log out & sign in"
      cancelButtonProps={{ style: { display: 'none' } }}
      onOk={handleRelogin}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
    >
      <p style={{ marginBottom: 0 }}>
        Your session has expired or is no longer valid. Please log out and sign
        in again to continue.
      </p>
    </Modal>
  );
};

export default SessionExpiredModal;
