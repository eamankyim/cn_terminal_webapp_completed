import apiService from './api';

class PaymentService {
  async getPayments(params = {}) {
    try {
      const response = await apiService.getPayments(params);
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPayment(id) {
    try {
      const response = await apiService.getPayment(id);
      return response.payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async createPayment(data) {
    try {
      const response = await apiService.createPayment(data);
      return response.payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(id, data) {
    try {
      const response = await apiService.updatePayment(id, data);
      return response.payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async updatePaymentStatus(id, status) {
    try {
      const response = await apiService.updatePaymentStatus(id, status);
      return response.payment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  async deletePayment(id) {
    try {
      const response = await apiService.deletePayment(id);
      return response;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
}

export default new PaymentService();
