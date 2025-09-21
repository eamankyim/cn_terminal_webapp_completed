import apiService from './api';

class InvoiceService {
  async getInvoices(params = {}) {
    try {
      const response = await apiService.getInvoices(params);
      return response;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getInvoice(id) {
    try {
      const response = await apiService.getInvoice(id);
      return response.invoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async createInvoice(data) {
    try {
      const response = await apiService.createInvoice(data);
      return response.invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id, data) {
    try {
      const response = await apiService.updateInvoice(id, data);
      return response.invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id, status, paymentDate, paymentMethod) {
    try {
      const response = await apiService.updateInvoiceStatus(id, status, paymentDate, paymentMethod);
      return response.invoice;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      const response = await apiService.deleteInvoice(id);
      return response;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  async getJobsForInvoice(search = '') {
    try {
      const response = await apiService.getJobsForInvoice(search);
      return response;
    } catch (error) {
      console.error('Error fetching jobs for invoice creation:', error);
      throw error;
    }
  }

  async createPayment(invoiceId, paymentData) {
    try {
      const response = await apiService.createPayment(invoiceId, paymentData);
      return response;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }
}

export default new InvoiceService();
