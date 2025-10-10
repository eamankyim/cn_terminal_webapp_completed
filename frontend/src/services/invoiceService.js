import apiService from './api';

class InvoiceService {
  async getInvoices(params = {}) {
    try {
      const response = await apiService.getInvoices(params);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async getInvoice(id) {
    try {
      const response = await apiService.getInvoice(id);
      return response.invoice;
    } catch (error) {

      throw error;
    }
  }

  async createInvoice(data) {
    try {
      const response = await apiService.createInvoice(data);
      return response.invoice;
    } catch (error) {

      throw error;
    }
  }

  async updateInvoice(id, data) {
    try {
      const response = await apiService.updateInvoice(id, data);
      return response.invoice;
    } catch (error) {

      throw error;
    }
  }

  async updateInvoiceStatus(id, status, paymentDate, paymentMethod) {
    try {
      const response = await apiService.updateInvoiceStatus(id, status, paymentDate, paymentMethod);
      return response.invoice;
    } catch (error) {

      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      const response = await apiService.deleteInvoice(id);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async getJobsForInvoice(search = '') {
    try {
      const response = await apiService.getJobsForInvoice(search);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async createPayment(invoiceId, paymentData) {
    try {
      const response = await apiService.createPayment(invoiceId, paymentData);
      return response;
    } catch (error) {

      throw error;
    }
  }
}

export default new InvoiceService();
