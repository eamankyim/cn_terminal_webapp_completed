import api from './api';

const PAYOUT_API_BASE = '/payouts';

export const payoutService = {
  // Payouts
  getPayouts: async (params = {}) => {
    try {
      const response = await api.get(PAYOUT_API_BASE, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  getPayout: async (id) => {
    try {
      const response = await api.get(`${PAYOUT_API_BASE}/${id}`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  createPayout: async (data) => {
    try {
      const response = await api.post(PAYOUT_API_BASE, data);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  updatePayoutStatus: async (id, status, paymentDate) => {
    try {
      const response = await api.patch(`${PAYOUT_API_BASE}/${id}/status`, {
        status,
        paymentDate
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  updatePayout: async (id, data) => {
    try {
      const response = await api.patch(`${PAYOUT_API_BASE}/${id}`, data);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  deletePayout: async (id) => {
    try {
      const response = await api.delete(`${PAYOUT_API_BASE}/${id}`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Statistics
  getPayoutStats: async (params = {}) => {
    try {
      console.log('🔍 PayoutService: Calling getPayoutStats with params:', params);
      const response = await api.get(`${PAYOUT_API_BASE}/stats/summary`, { params });
      console.log('📊 PayoutService: getPayoutStats response:', response);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('❌ PayoutService: getPayoutStats error:', error);
      throw error;
    }
  },

  // Payout Records
  getPayoutRecords: async (params = {}) => {
    try {
      const response = await api.get(`${PAYOUT_API_BASE}/records`, { params });
      return response;
    } catch (error) {

      throw error;
    }
  },

  createPayoutRecord: async (data) => {
    try {
      const response = await api.post(`${PAYOUT_API_BASE}/records`, data);
      return response;
    } catch (error) {

      throw error;
    }
  },

  getPayoutRecord: async (id) => {
    try {
      const response = await api.get(`${PAYOUT_API_BASE}/records/${id}`);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Utility functions
  getPayoutCategories: () => {
    return [
      { value: 'DRIVER_PAYMENT', label: 'Driver Payment', description: 'Payments to drivers for completed jobs' },
      { value: 'VENDOR_PAYMENT', label: 'Vendor Payment', description: 'Payments to suppliers and service providers' },
      { value: 'OPERATIONS', label: 'Operations', description: 'Operational expenses and payments' },
      { value: 'MISCELLANEOUS', label: 'Miscellaneous', description: 'Other legitimate business payments' }
    ];
  },

  getPaymentMethods: () => {
    return [
      { value: 'BANK_TRANSFER', label: 'Bank Transfer', description: 'Direct bank account transfer' },
      { value: 'MOBILE_MONEY', label: 'Mobile Money', description: 'MTN, Vodafone, AirtelTigo' },
      { value: 'CASH', label: 'Cash', description: 'Physical cash payment' }
    ];
  },

  getPayoutStatuses: () => {
    return [
      { value: 'COMPLETED', label: 'Completed', color: 'green' },
      { value: 'FAILED', label: 'Failed', color: 'red' },
      { value: 'PENDING', label: 'Pending', color: 'orange' }
    ];
  },

  formatPayoutAmount: (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  }
};

export default payoutService;
