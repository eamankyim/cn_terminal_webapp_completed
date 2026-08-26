import api from './api';

const CASHFLOW_API_BASE = '/cashflow';

export const cashflowService = {
  // Transactions
  getTransactions: async (params = {}) => {
    try {
      const response = await api.get(`${CASHFLOW_API_BASE}/transactions`, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  createTransaction: async (data) => {
    try {
      const response = await api.post(`${CASHFLOW_API_BASE}/transactions`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  recordCashIn: async (data) => {
    const response = await api.post(`${CASHFLOW_API_BASE}/cash-in`, data);
    return response;
  },

  // Summary and Dashboard
  getSummary: async (params = {}) => {
    try {
      console.log('🔍 CashflowService: Calling getSummary with params:', params);
      const response = await api.get(`${CASHFLOW_API_BASE}/summary`, { params });
      console.log('📊 CashflowService: getSummary response:', response);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('❌ CashflowService: getSummary error:', error);
      throw error;
    }
  },

  getBalance: async (params = {}) => {
    try {
      const response = await api.get(`${CASHFLOW_API_BASE}/balance`, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  getJobProfitability: async (jobId) => {
    try {
      const response = await api.get(`${CASHFLOW_API_BASE}/job-profitability/${jobId}`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  getTrends: async (params = {}) => {
    try {
      const response = await api.get(`${CASHFLOW_API_BASE}/trends`, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Utility functions
  getCashflowTypes: () => {
    return [
      { value: 'INFLOW', label: 'Inflow', color: 'green', description: 'Money coming in' },
      { value: 'OUTFLOW', label: 'Outflow', color: 'red', description: 'Money going out' }
    ];
  },

  getSourceTypes: () => {
    return [
      { value: 'INVOICE', label: 'Invoice', description: 'Invoice payments' },
      { value: 'EXPENSE', label: 'Expense', description: 'Business expenses' },
      { value: 'PAYOUT', label: 'Payout', description: 'Staff/contractor payments' },
      { value: 'OTHER', label: 'Other', description: 'Other transactions' }
    ];
  },

  getPeriods: () => {
    return [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'year', label: 'This Year' }
    ];
  },

  getTrendTypes: () => {
    return [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' }
    ];
  },

  formatAmount: (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  },

  formatPercentage: (value, decimals = 1) => {
    return `${parseFloat(value).toFixed(decimals)}%`;
  },

  calculateNetCashflow: (inflows, outflows) => {
    return inflows - outflows;
  },

  calculateProfitMargin: (profit, revenue) => {
    if (revenue === 0) return 0;
    return (profit / revenue) * 100;
  }
};

export default cashflowService;
