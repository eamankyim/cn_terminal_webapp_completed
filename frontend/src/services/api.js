// API Service Layer for CN Terminal
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const config = {
      headers: this.getHeaders(options.headers, isFormData),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    const { params = {} } = options;
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
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
    return this.put('/auth/change-password', { currentPassword, newPassword });
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

  async updateJobStatus(id, status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact) {
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

  async getRecentJobs(limit = 10) {
    return this.get('/dashboard/recent-jobs', { limit });
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
