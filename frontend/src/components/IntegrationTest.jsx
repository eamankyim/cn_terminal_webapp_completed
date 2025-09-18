import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Divider, List, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import testApiIntegration from '../utils/testApi';
import apiService from '../services/api';

const { Title, Text } = Typography;

const IntegrationTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [overallStatus, setOverallStatus] = useState(null);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    setOverallStatus(null);

    const testResults = [];

    try {
      // Test 1: Health Check
      testResults.push({ name: 'Health Check', status: 'running' });
      setResults([...testResults]);
      
      try {
        const health = await apiService.healthCheck();
        testResults[0] = { 
          name: 'Health Check', 
          status: 'success', 
          message: `API is running - ${health.message}`,
          details: health
        };
      } catch (error) {
        testResults[0] = { 
          name: 'Health Check', 
          status: 'error', 
          message: error.message 
        };
      }
      setResults([...testResults]);

      // Test 2: Authentication
      testResults.push({ name: 'Authentication', status: 'running' });
      setResults([...testResults]);
      
      try {
        const loginResponse = await apiService.login('admin@cnterminal.com', 'admin123');
        testResults[1] = { 
          name: 'Authentication', 
          status: 'success', 
          message: `Login successful - ${loginResponse.user?.email}`,
          details: loginResponse
        };
      } catch (error) {
        testResults[1] = { 
          name: 'Authentication', 
          status: 'error', 
          message: error.message 
        };
      }
      setResults([...testResults]);

      // Test 3: Customer API
      testResults.push({ name: 'Customer API', status: 'running' });
      setResults([...testResults]);
      
      try {
        const customers = await apiService.getCustomers();
        testResults[2] = { 
          name: 'Customer API', 
          status: 'success', 
          message: `Found ${customers.customers?.length || 0} customers`,
          details: customers
        };
      } catch (error) {
        testResults[2] = { 
          name: 'Customer API', 
          status: 'error', 
          message: error.message 
        };
      }
      setResults([...testResults]);

      // Test 4: Customer Selector API
      testResults.push({ name: 'Customer Selector API', status: 'running' });
      setResults([...testResults]);
      
      try {
        const selectorCustomers = await apiService.getCustomersForSelector();
        testResults[3] = { 
          name: 'Customer Selector API', 
          status: 'success', 
          message: `Selector API working - ${selectorCustomers.customers?.length || 0} customers`,
          details: selectorCustomers
        };
      } catch (error) {
        testResults[3] = { 
          name: 'Customer Selector API', 
          status: 'error', 
          message: error.message 
        };
      }
      setResults([...testResults]);

      // Test 5: Public Tracking
      testResults.push({ name: 'Public Tracking', status: 'running' });
      setResults([...testResults]);
      
      try {
        const tracking = await apiService.trackPackage('TEST123');
        testResults[4] = { 
          name: 'Public Tracking', 
          status: 'success', 
          message: 'Public tracking API working',
          details: tracking
        };
      } catch (error) {
        testResults[4] = { 
          name: 'Public Tracking', 
          status: 'error', 
          message: error.message 
        };
      }
      setResults([...testResults]);

      // Calculate overall status
      const successCount = testResults.filter(r => r.status === 'success').length;
      const totalTests = testResults.length;
      
      if (successCount === totalTests) {
        setOverallStatus('success');
      } else if (successCount > 0) {
        setOverallStatus('partial');
      } else {
        setOverallStatus('error');
      }

    } catch (error) {
      console.error('Test suite failed:', error);
      setOverallStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <Title level={3}>🔧 API Integration Test</Title>
      <Text type="secondary">
        Test the connection between frontend and backend APIs
      </Text>
      
      <Divider />
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          onClick={runTests} 
          loading={testing}
          size="large"
        >
          {testing ? 'Running Tests...' : 'Run Integration Tests'}
        </Button>

        {overallStatus && (
          <Alert
            message={
              overallStatus === 'success' ? 'All Tests Passed!' :
              overallStatus === 'partial' ? 'Some Tests Passed' :
              'Tests Failed'
            }
            type={
              overallStatus === 'success' ? 'success' :
              overallStatus === 'partial' ? 'warning' :
              'error'
            }
            description={
              overallStatus === 'success' ? 'Your API integration is working perfectly!' :
              overallStatus === 'partial' ? 'Some API endpoints are working, but there may be configuration issues.' :
              'There are issues with your API integration. Check the backend server and database connection.'
            }
          />
        )}

        {results.length > 0 && (
          <List
            header={<Title level={4}>Test Results</Title>}
            dataSource={results}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStatusIcon(item.status)}
                  title={
                    <Space>
                      <Text strong>{item.name}</Text>
                      <Tag color={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text>{item.message}</Text>
                      {item.details && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {JSON.stringify(item.details, null, 2)}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
};

export default IntegrationTest;
