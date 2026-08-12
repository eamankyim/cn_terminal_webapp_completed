import apiService from './api';

class JobService {
  async getJobs(params = {}) {
    try {
      const response = await apiService.getJobs(params);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async getJob(id) {
    try {
      const response = await apiService.getJob(id);
      return response.job;
    } catch (error) {

      throw error;
    }
  }

  async createJob(data) {
    try {
      const response = await apiService.createJob(data);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async updateJob(id, data) {
    try {
      const response = await apiService.updateJob(id, data);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async reassignJob(id, { assignedToId, comment }) {
    try {
      const response = await apiService.post(`/jobs/${id}/reassign`, {
        assignedToId,
        comment,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateJobStatus(id, status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact, demurrageType, boeNumber) {
    try {
      const response = await apiService.updateJobStatus(id, status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact, demurrageType, boeNumber);
      return response; // Return the full response object
    } catch (error) {

      throw error;
    }
  }

  async deleteJob(id) {
    try {
      const response = await apiService.deleteJob(id);
      return response;
    } catch (error) {

      throw error;
    }
  }

  async getCustomerConsignments(customerId) {
    try {
      const response = await apiService.getCustomerConsignments(customerId);
      return response.consignments;
    } catch (error) {

      throw error;
    }
  }

  async addJobComment(jobId, comment) {
    try {
      const response = await apiService.post(`/jobs/${jobId}/comments`, { comment });
      return response;
    } catch (error) {

      throw error;
    }
  }

  async getJobComments(jobId) {
    try {
      const response = await apiService.get(`/jobs/${jobId}/comments`);
      return response.comments || [];
    } catch (error) {

      throw error;
    }
  }
}

const jobService = new JobService();

export default jobService;
