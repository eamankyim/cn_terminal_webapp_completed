import apiService from './api';

class ConsignmentService {
  // Get all consignments for a customer
  async getConsignmentsByCustomer(customerId) {
    try {
      const response = await apiService.get(`/consignments/customer/${customerId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all consignments
  async getAllConsignments() {
    try {
      const response = await apiService.get('/consignments');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get consignment by ID
  async getConsignmentById(id) {
    try {
      const response = await apiService.get(`/consignments/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Create new consignment
  async createConsignment(consignmentData) {
    try {
      const response = await apiService.post('/consignments', consignmentData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update consignment
  async updateConsignment(id, consignmentData) {
    try {
      const response = await apiService.put(`/consignments/${id}`, consignmentData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete consignment
  async deleteConsignment(id) {
    try {
      const response = await apiService.delete(`/consignments/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update consignment status
  async updateConsignmentStatus(id, status) {
    try {
      const response = await apiService.patch(`/consignments/${id}/status`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Generate tracking ID
  generateTrackingId() {
    const prefix = 'CN';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }
}

const consignmentService = new ConsignmentService();

export default consignmentService;

