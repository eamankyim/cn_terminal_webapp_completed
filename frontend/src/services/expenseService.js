import api from './api';

const EXPENSE_API_BASE = '/expenses';

export const expenseService = {
  // User's own expense requests (no special permission required)
  getMyExpenseRequests: async (params = {}) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/my-requests`, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  getMyExpenseStats: async (params = {}) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/my-stats`, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Record expense directly (for admins/accountants)
  recordExpense: async (expenseData) => {
    try {
      const response = await api.post(`${EXPENSE_API_BASE}/record`, expenseData);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Expense Requests (requires accounting permission)
  getExpenseRequests: async (params = {}) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/requests`, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  getExpenseRequest: async (id) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/requests/${id}`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  createExpenseRequest: async (data) => {
    try {
      const response = await api.post(`${EXPENSE_API_BASE}/requests`, data);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  approveExpenseRequest: async (id, comment) => {
    try {
      const response = await api.patch(`${EXPENSE_API_BASE}/requests/${id}/approve`, {
        approvalComment: comment
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  endorseExpenseRequest: async (id, comment) => {
    const response = await api.patch(`${EXPENSE_API_BASE}/requests/${id}/endorse`, {
      endorsementComment: comment
    });
    return response;
  },

  rejectExpenseRequest: async (id, rejectionReason) => {
    try {
      const response = await api.patch(`${EXPENSE_API_BASE}/requests/${id}/reject`, {
        rejectionReason
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  markExpenseRequestAsPaid: async (id) => {
    try {
      const response = await api.patch(`${EXPENSE_API_BASE}/requests/${id}/mark-paid`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Expenses (Approved)
  getExpenses: async (params = {}) => {
    try {
      const response = await api.get(EXPENSE_API_BASE, { params });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  getExpense: async (id) => {
    try {
      const response = await api.get(`${EXPENSE_API_BASE}/${id}`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Statistics
  getExpenseStats: async (params = {}) => {
    try {
      console.log('🔍 ExpenseService: Calling getExpenseStats with params:', params);
      const response = await api.get(`${EXPENSE_API_BASE}/stats/summary`, { params });
      console.log('📊 ExpenseService: getExpenseStats response:', response);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('❌ ExpenseService: getExpenseStats error:', error);
      throw error;
    }
  },

  // Utility functions
  getExpenseCategories: () => {
    return [
      { value: 'FUEL', label: 'Fuel', description: 'Vehicle fuel, gas, diesel' },
      { value: 'MATERIALS', label: 'Materials', description: 'Supplies, equipment, tools' },
      { value: 'OPERATIONS', label: 'Operations', description: 'Operational costs, maintenance' },
      { value: 'MISCELLANEOUS', label: 'Miscellaneous', description: 'General business expenses' },
      { value: 'OTHER', label: 'Other', description: 'Specify a custom category' }
    ];
  },

  formatExpenseCategory: (record) => {
    if (!record) return '';
    if (record.category === 'OTHER' && record.categoryOther) {
      return record.categoryOther;
    }
    const categoryConfig = expenseService.getExpenseCategories().find(
      (c) => c.value === record.category
    );
    return categoryConfig?.label || record.category || '';
  },

  getExpenseStatuses: () => {
    return [
      { value: 'PENDING', label: 'Pending', color: 'orange' },
      { value: 'ENDORSED', label: 'Endorsed', color: 'cyan' },
      { value: 'APPROVED', label: 'Approved', color: 'green' },
      { value: 'REJECTED', label: 'Rejected', color: 'red' },
      { value: 'PAID', label: 'Paid', color: 'blue' }
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
