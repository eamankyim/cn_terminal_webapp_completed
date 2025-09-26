import React, { useState } from 'react';
import { Button, Badge } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import WhatsAppCustomerIntegration from './WhatsAppCustomerIntegration';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <div className="whatsapp-button">
        <Badge 
          count={0} 
          size="small"
          style={{ 
            backgroundColor: '#ff4d4f',
            boxShadow: '0 0 0 1px #d9d9d9 inset'
          }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<WhatsAppOutlined />}
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#25D366',
              borderColor: '#25D366',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
            }}
            onClick={() => setModalVisible(true)}
          />
        </Badge>
      </div>

      <WhatsAppCustomerIntegration 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
};

export default WhatsAppButton;
