import apiService from './api';

class EstimateService {
  async getEstimates(params = {}) {
    try {
      console.log('🔷 [EstimateService] Getting estimates');
      const response = await apiService.get('/estimates', { params });
      console.log('✅ [EstimateService] Got', response?.estimates?.length, 'estimates');
      return response;
    } catch (error) {
      console.error('❌ [EstimateService] Get estimates error:', error);
      throw error;
    }
  }

  async getEstimate(id) {
    try {
      console.log('🔷 [EstimateService] Getting estimate:', id);
      const response = await apiService.get(`/estimates/${id}`);
      console.log('✅ [EstimateService] Got estimate:', response?.estimate?.estimateNumber);
      return response.estimate;
    } catch (error) {
      console.error('❌ [EstimateService] Get estimate error:', error);
      throw error;
    }
  }

  async createEstimate(data) {
    try {
      console.log('🔷 [EstimateService] Creating estimate');
      console.log('  - Data:', data);
      const response = await apiService.post('/estimates', data);
      console.log('✅ [EstimateService] Created estimate:', response?.estimate?.estimateNumber);
      return response;
    } catch (error) {
      console.error('❌ [EstimateService] Create estimate error:', error);
      throw error;
    }
  }

  async updateEstimate(id, data) {
    try {
      console.log('🔷 [EstimateService] Updating estimate:', id);
      console.log('  - Data:', data);
      const response = await apiService.put(`/estimates/${id}`, data);
      console.log('✅ [EstimateService] Updated estimate:', response?.estimate?.estimateNumber);
      return response;
    } catch (error) {
      console.error('❌ [EstimateService] Update estimate error:', error);
      throw error;
    }
  }

  async deleteEstimate(id) {
    try {
      console.log('🔷 [EstimateService] Deleting estimate:', id);
      const response = await apiService.delete(`/estimates/${id}`);
      console.log('✅ [EstimateService] Deleted estimate');
      return response;
    } catch (error) {
      console.error('❌ [EstimateService] Delete estimate error:', error);
      throw error;
    }
  }

  async sendEstimate(id) {
    try {
      console.log('🔷 [EstimateService] Sending estimate:', id);
      const response = await apiService.post(`/estimates/${id}/send`);
      console.log('✅ [EstimateService] Sent estimate');
      return response;
    } catch (error) {
      console.error('❌ [EstimateService] Send estimate error:', error);
      throw error;
    }
  }
}

const estimateService = new EstimateService();

export default estimateService;

