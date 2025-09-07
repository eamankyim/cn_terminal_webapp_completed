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
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
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

  async updateJobStatus(id, status, comment) {
    return this.put(`/jobs/${id}/status`, { status, comment });
  }

  async deleteJob(id) {
    return this.delete(`/jobs/${id}`);
  }

  async getCustomerConsignments(customerId) {
    return this.get(`/jobs/customer/${customerId}/consignments`);
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

  // Shipment endpoints
  async getShipments(params = {}) {
    return this.get('/shipments', params);
  }

  async getShipment(id) {
    return this.get(`/shipments/${id}`);
  }

  async createShipment(data) {
    return this.post('/shipments', data);
  }

  async updateShipment(id, data) {
    return this.put(`/shipments/${id}`, data);
  }

  async updateShipmentStatus(id, status, collectionDate) {
    return this.put(`/shipments/${id}/status`, { status, collectionDate });
  }

  async deleteShipment(id) {
    return this.delete(`/shipments/${id}`);
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

  // Payment endpoints
  async getPayments(params = {}) {
    return this.get('/payments', params);
  }

  async getPayment(id) {
    return this.get(`/payments/${id}`);
  }

  async createPayment(data) {
    return this.post('/payments', data);
  }

  async updatePayment(id, data) {
    return this.put(`/payments/${id}`, data);
  }

  async updatePaymentStatus(id, status) {
    return this.put(`/payments/${id}/status`, { status });
  }

  async deletePayment(id) {
    return this.delete(`/payments/${id}`);
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
