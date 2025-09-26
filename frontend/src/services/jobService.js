import apiService from './api';

class JobService {
  async getJobs(params = {}) {
    try {
      const response = await apiService.getJobs(params);
      return response;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  async getJob(id) {
    try {
      const response = await apiService.getJob(id);
      return response.job;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  async createJob(data) {
    try {
      const response = await apiService.createJob(data);
      return response;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async updateJob(id, data) {
    try {
      const response = await apiService.updateJob(id, data);
      return response;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  async updateJobStatus(id, status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact) {
    try {
      const response = await apiService.updateJobStatus(id, status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact);
      return response; // Return the full response object
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  async deleteJob(id) {
    try {
      const response = await apiService.deleteJob(id);
      return response;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  async getCustomerConsignments(customerId) {
    try {
      const response = await apiService.getCustomerConsignments(customerId);
      return response.consignments;
    } catch (error) {
      console.error('Error fetching customer consignments:', error);
      throw error;
    }
  }
}

export default new JobService();
