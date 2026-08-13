// API Service Layer for CN Terminal
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/** Fired on window when a protected API call returns 401. */
export const SESSION_EXPIRED_EVENT = 'cn_terminal_session_expired';

let sessionExpiredNotified = false;

export function clearSessionExpiredFlag() {
  sessionExpiredNotified = false;
}

function notifySessionExpired(endpoint) {
  // Never treat public auth endpoints as session expiry
  if (
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/forgot-password') ||
    endpoint.includes('/auth/reset-password') ||
    endpoint.includes('/auth/verify-reset-token') ||
    endpoint.includes('/invitations/') ||
    endpoint.includes('/init/')
  ) {
    return;
  }

  if (sessionExpiredNotified) return;
  sessionExpiredNotified = true;

  try {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { endpoint },
      })
    );
  } catch (_) {
    // ignore
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('cn_terminal_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('cn_terminal_token', token);
    } else {
      localStorage.removeItem('cn_terminal_token');
    }
  }

  // Get authentication headers
  getHeaders(customHeaders = {}, isFormData = false) {
    const headers = {
      ...customHeaders
    };
    
    // Only set default Content-Type if not already specified and not FormData
    if (!headers['Content-Type'] && !headers['content-type'] && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Refresh token from localStorage
  refreshToken() {
    this.token = localStorage.getItem('cn_terminal_token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    // Refresh token before each request
    this.refreshToken();
    
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const timeoutMs = options.timeoutMs ?? 20_000;
    const {
      timeoutMs: _ignoredTimeout,
      signal: externalSignal,
      headers: customHeaders,
      ...restOptions
    } = options;
    // Build auth headers last so an undefined `headers` option cannot wipe Authorization
    const config = {
      ...restOptions,
      headers: this.getHeaders(customHeaders, isFormData),
    };

    // Add logging for team members endpoint
    const isUsersEndpoint = endpoint.includes('/auth/users');
    
    if (isUsersEndpoint) {
      console.log('  - [ApiService] Making request to:', url);
      console.log('  - [ApiService] Request method:', config.method || 'GET');
      console.log('  - [ApiService] Request headers:', {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers['Authorization'] ? 'Bearer ***' : 'MISSING'
      });
      console.log('  - [ApiService] Base URL:', this.baseURL);
      console.log('  - [ApiService] Token from localStorage:', !!localStorage.getItem('cn_terminal_token'));
    }

    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort);
      }
    }
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    config.signal = controller.signal;

    try {
      const startTime = Date.now();
      const response = await fetch(url, config);
      const requestTime = Date.now() - startTime;
      
      if (isUsersEndpoint) {
        console.log('  - [ApiService] Response received in', requestTime, 'ms');
        console.log('  - [ApiService] Response status:', response.status);
        console.log('  - [ApiService] Response statusText:', response.statusText);
        console.log('  - [ApiService] Response ok:', response.ok);
        console.log('  - [ApiService] Response headers:', {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length')
        });
      }
      
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('  - [ApiService] Failed to parse error response:', parseError);
          const text = await response.text().catch(() => '');
          console.error('  - [ApiService] Error response text:', text);
        }
        
        if (isUsersEndpoint) {
          console.error('❌ [ApiService] Request failed:');
          console.error('  - Status:', response.status);
          console.error('  - StatusText:', response.statusText);
          console.error('  - Error data:', errorData);
        }
        
        const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = { data: errorData };
        if (response.status === 401) {
          notifySessionExpired(endpoint);
        }
        throw error;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ [ApiService] Failed to parse response JSON:', parseError);
        console.error('  - Response status:', response.status);
        const text = await response.text().catch(() => '');
        console.error('  - Response text:', text.substring(0, 200));
        throw new Error('Invalid JSON response from server');
      }
      
      if (isUsersEndpoint) {
        console.log('✅ [ApiService] Response parsed successfully');
        console.log('  - Response data type:', typeof data);
        console.log('  - Has users property:', !!data.users);
        console.log('  - Users is array:', Array.isArray(data.users));
        console.log('  - Users count:', data.users?.length || 0);
        if (data.users && data.users.length > 0) {
          console.log('  - Sample user:', {
            id: data.users[0].id,
            email: data.users[0].email,
            role: data.users[0].role
          });
        }
      }
      
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') {
        const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
        timeoutError.status = 408;
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      if (isUsersEndpoint) {
        console.error('❌ [ApiService] Request error:');
        console.error('  - Error name:', error.name);
        console.error('  - Error message:', error.message);
        console.error('  - Error status:', error.status);
        console.error('  - Network error:', error.name === 'TypeError' && error.message.includes('fetch'));
        if (error.response) {
          console.error('  - Error response data:', error.response.data);
        }
        if (error.stack) {
          console.error('  - Error stack:', error.stack);
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  // GET request
  // Accepts flat query args: get('/jobs', { limit: 100, page: 1 })
  // or nested: get('/jobs', { params: { limit: 100 }, timeoutMs: 20000 })
  async get(endpoint, paramsOrOptions = {}) {
    const nested =
      paramsOrOptions &&
      typeof paramsOrOptions === 'object' &&
      paramsOrOptions.params &&
      typeof paramsOrOptions.params === 'object';
    const querySource = nested ? paramsOrOptions.params : paramsOrOptions;
    const cleaned = Object.fromEntries(
      Object.entries(querySource || {}).filter(
        ([key, value]) =>
          value !== undefined &&
          value !== null &&
          !['headers', 'timeoutMs', 'signal', 'params', 'method', 'body'].includes(key)
      )
    );
    const queryString = new URLSearchParams(
      Object.entries(cleaned).map(([key, value]) => [key, String(value)])
    ).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    // Add logging for team members endpoint
    if (endpoint.includes('/auth/users')) {
      console.log('\n🔷 [ApiService] GET /auth/users called');
      console.log('  - Endpoint:', endpoint);
      console.log('  - Full URL:', `${this.baseURL}${url}`);
      console.log('  - Token present:', !!this.token);
      console.log('  - Token length:', this.token?.length || 0);
      console.log('  - Token preview:', this.token ? `${this.token.substring(0, 20)}...` : 'NONE');
    }
    
    return this.request(url, {
      method: 'GET',
      ...(paramsOrOptions.headers ? { headers: paramsOrOptions.headers } : {}),
      ...(paramsOrOptions.timeoutMs != null
        ? { timeoutMs: paramsOrOptions.timeoutMs }
        : {}),
      ...(paramsOrOptions.signal ? { signal: paramsOrOptions.signal } : {}),
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    const requestOptions = {
      method: 'POST',
      ...options
    };
    
    // Only stringify if it's not FormData and no custom body is provided
    if (!(data instanceof FormData) && !options.body) {
      requestOptions.body = JSON.stringify(data);
    } else {
      requestOptions.body = data;
    }
    
    return this.request(endpoint, requestOptions);
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, data = null) {
    const options = { method: 'DELETE' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request(endpoint, options);
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(data) {
    return this.put('/auth/profile', data);
  }

  async changePassword(currentPassword, newPassword) {
    console.log('🔷 [API] changePassword called');
    console.log('  - Current password:', currentPassword ? '***' + currentPassword.slice(-4) : 'NONE');
    console.log('  - New password:', newPassword ? '***' + newPassword.slice(-4) : 'NONE');
    console.log('  - Endpoint: /auth/change-password');
    try {
      const response = await this.put('/auth/change-password', { currentPassword, newPassword });
      console.log('✅ [API] changePassword response:', response);
      return response;
    } catch (error) {
      console.error('❌ [API] changePassword error:', error);
      console.error('  - Error response:', error.response?.data);
      throw error;
    }
  }

  // Customer endpoints
  async getCustomers(params = {}) {
    return this.get('/customers', params);
  }

  async getCustomer(id) {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(data) {
    return this.post('/customers', data);
  }

  async updateCustomer(id, data) {
    return this.put(`/customers/${id}`, data);
  }

  async deleteCustomer(id) {
    return this.delete(`/customers/${id}`);
  }

  async getCustomerStatistics(id) {
    return this.get(`/customers/${id}/statistics`);
  }

  async getCustomersForSelector(search = '') {
    return this.get('/customers/selector', { search });
  }

  // Enquiry endpoints
  async getEnquiries(params = {}) {
    return this.get('/enquiries', params);
  }

  async getEnquiry(id) {
    return this.get(`/enquiries/${id}`);
  }

  async createEnquiry(data) {
    return this.post('/enquiries', data);
  }

  async updateEnquiry(id, data) {
    return this.put(`/enquiries/${id}`, data);
  }

  async updateEnquiryStatus(id, status) {
    return this.put(`/enquiries/${id}/status`, { status });
  }

  async deleteEnquiry(id) {
    return this.delete(`/enquiries/${id}`);
  }

  // Job endpoints
  async getJobs(params = {}) {
    return this.get('/jobs', params);
  }

  async getJob(id) {
    return this.get(`/jobs/${id}`);
  }

  async createJob(data) {
    return this.post('/jobs', data);
  }

  async updateJob(id, data) {
    return this.put(`/jobs/${id}`, data);
  }

  async updateJobStatus(id, status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact, demurrageType, boeNumber) {
    const data = { status, comment };
    if (eta) {
      data.eta = eta;
    }
    if (assignedToId) {
      data.assignedToId = assignedToId;
    }
    if (demurrageFreeDays !== undefined) {
      data.demurrageFreeDays = demurrageFreeDays;
    }
    if (releaseMoneyReceived !== undefined) {
      data.releaseMoneyReceived = releaseMoneyReceived;
    }
    if (shipperName !== undefined) {
      data.shipperName = shipperName;
    }
    if (invoiceNumber !== undefined) {
      data.invoiceNumber = invoiceNumber;
    }
    if (terminalName !== undefined) {
      data.terminalName = terminalName;
    }
    if (scheduleTime !== undefined) {
      data.scheduleTime = scheduleTime;
    }
    if (driverName !== undefined) {
      data.driverName = driverName;
    }
    if (driverContact !== undefined) {
      data.driverContact = driverContact;
    }
    if (demurrageType !== undefined) {
      data.demurrageType = demurrageType;
    }
    if (boeNumber !== undefined) {
      data.boeNumber = boeNumber;
    }
    
    return this.put(`/jobs/${id}/status`, data);
  }

  async deleteJob(id) {
    return this.delete(`/jobs/${id}`);
  }

  async getCustomerConsignments(customerId) {
    return this.get(`/consignments/customer/${customerId}`);
  }

  // Consignment endpoints
  async getConsignments(params = {}) {
    return this.get('/consignments', params);
  }

  async getConsignment(id) {
    return this.get(`/consignments/${id}`);
  }

  async createConsignment(data) {
    return this.post('/consignments', data);
  }

  async updateConsignment(id, data) {
    return this.put(`/consignments/${id}`, data);
  }

  async updateConsignmentStatus(id, status) {
    return this.put(`/consignments/${id}/status`, { status });
  }

  async deleteConsignment(id) {
    return this.delete(`/consignments/${id}`);
  }

  // Invoice endpoints
  async getInvoices(params = {}) {
    return this.get('/invoices', params);
  }

  async getInvoice(id) {
    return this.get(`/invoices/${id}`);
  }

  async createInvoice(data) {
    return this.post('/invoices', data);
  }

  async updateInvoice(id, data) {
    return this.put(`/invoices/${id}`, data);
  }

  async updateInvoiceStatus(id, status, paymentDate, paymentMethod) {
    return this.put(`/invoices/${id}/status`, { status, paymentDate, paymentMethod });
  }

  async deleteInvoice(id) {
    return this.delete(`/invoices/${id}`);
  }

  async getJobsForInvoice(search = '') {
    return this.get('/invoices/jobs', { search });
  }

  async createPayment(invoiceId, paymentData) {
    return this.post(`/invoices/${invoiceId}/payments`, paymentData);
  }

  // Public tracking endpoint (no authentication required)
  async trackPackage(trackingId) {
    const response = await fetch(`${this.baseURL}/track/${trackingId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRecentShipments(limit = 10) {
    return this.get('/dashboard/recent-shipments', { limit });
  }

  async getRecentJobs(limit = 10, etaFilter) {
    const params = { limit };
    if (etaFilter && etaFilter !== 'ALL') {
      params.etaFilter = etaFilter;
    }
    return this.get('/dashboard/recent-jobs', params);
  }

  async getAssignedJobs(limit = 10) {
    return this.get('/dashboard/assigned-jobs', { limit });
  }

  // Reports endpoints
  async getReportsOverview(startDate, endDate) {
    return this.get('/reports/overview', { startDate, endDate });
  }

  async getRevenueAnalysis(period = 'monthly', months = 12) {
    return this.get('/reports/revenue-analysis', { period, months });
  }

  async getPerformanceMetrics(startDate, endDate) {
    return this.get('/reports/performance-metrics', { startDate, endDate });
  }

  async generateReport(data) {
    return this.post('/reports/generate', data);
  }

  async getReports(params = {}) {
    return this.get('/reports', params);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
