import api from './api';

const EXPENSE_API_BASE = '/expenses';

export const expenseService = {
  // Expense Requests
  getExpenseRequests: async (params = {}) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/requests`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching expense requests:', error);
      throw error;
    }
  },

  getExpenseRequest: async (id) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense request:', error);
      throw error;
    }
  },

  createExpenseRequest: async (data) => {
    try {
      const response = await api.post(`${EXPENSE_API_BASE}/requests`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating expense request:', error);
      throw error;
    }
  },

  approveExpenseRequest: async (id) => {
    try {
      const response = await api.patch(`${EXPENSE_API_BASE}/requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving expense request:', error);
      throw error;
    }
  },

  rejectExpenseRequest: async (id, rejectionReason) => {
    try {
      const response = await api.patch(`${EXPENSE_API_BASE}/requests/${id}/reject`, {
        rejectionReason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting expense request:', error);
      throw error;
    }
  },

  // Expenses (Approved)
  getExpenses: async (params = {}) => {
    try {
      const response = await api.get(EXPENSE_API_BASE, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  getExpense: async (id) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  // Statistics
  getExpenseStats: async (params = {}) => {
    try {
      console.log('🔍 EXPENSE SERVICE - getExpenseStats called with params:', params);
      console.log('🔍 EXPENSE SERVICE - calling endpoint:', `${EXPENSE_API_BASE}/stats/summary`);
      const response = await api.get(`${EXPENSE_API_BASE}/stats/summary`, { params });
      console.log('🔍 EXPENSE SERVICE - raw response:', response);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      throw error;
    }
  },

  // Utility functions
  getExpenseCategories: () => {
    return [
      { value: 'FUEL', label: 'Fuel', description: 'Vehicle fuel, gas, diesel' },
      { value: 'MATERIALS', label: 'Materials', description: 'Supplies, equipment, tools' },
      { value: 'OPERATIONS', label: 'Operations', description: 'Operational costs, maintenance' },
      { value: 'MISCELLANEOUS', label: 'Miscellaneous', description: 'Other business expenses' }
    ];
  },

  getExpenseStatuses: () => {
    return [
      { value: 'PENDING', label: 'Pending', color: 'orange' },
      { value: 'APPROVED', label: 'Approved', color: 'green' },
      { value: 'REJECTED', label: 'Rejected', color: 'red' }
    ];
  },

  formatExpenseAmount: (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  }
};

export default expenseService;
