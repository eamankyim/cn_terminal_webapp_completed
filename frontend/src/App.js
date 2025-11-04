import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { theme } from 'antd';
import './App.css';
import './styles/responsive.css';

// Layout and Pages
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import ClientsPage from './pages/ClientsPage';
import ReportsPage from './pages/ReportsPage';
import InvoicesPage from './pages/InvoicesPage';
import EstimatesPage from './pages/EstimatesPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import SettingsPage from './pages/SettingsPage';
import ConfigurationPage from './pages/ConfigurationPage';
import SetupPage from './pages/SetupPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import AccountingPage from './pages/AccountingPage';
import RequestsPage from './pages/RequestsPage';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';

// Auth Components
import { AuthProvider } from './contexts/AuthContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { ConsignmentProvider } from './contexts/ConsignmentContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './utils/apiTest'; // Import API test utilities

const { defaultAlgorithm } = theme;

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: defaultAlgorithm,
        token: {
          colorPrimary: '#2FA2EE',
          colorSuccess: '#4caf50',
          colorWarning: '#ff5722',
          colorError: '#f44336',
          colorInfo: '#2196f3',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <CustomerProvider>
          <ConsignmentProvider>
            <NotificationProvider>
              <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/accept-invitation/:id" element={<AcceptInvitationPage />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<RoleBasedRedirect />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="enquiries" element={<JobsPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="estimates" element={<EstimatesPage />} />

                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="accounting" element={<AccountingPage />} />
                  <Route path="requests" element={<RequestsPage />} />
                  <Route path="admin" element={<AdminDashboardPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="configuration" element={<ConfigurationPage />} />
                </Route>
                
                {/* Catch all route - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
            </Router>
            </NotificationProvider>
          </ConsignmentProvider>
        </CustomerProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;

