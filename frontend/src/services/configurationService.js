import api from './api';

const configurationService = {
  // Get all configurations grouped by category
  async getConfigurations() {
    try {
      const response = await api.get('/configurations');
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Get configuration by key
  async getConfiguration(key) {
    try {
      const response = await api.get(`/configurations/${key}`);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Create or update a single configuration
  async saveConfiguration(configData) {
    try {
      const response = await api.post('/configurations', configData);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Update multiple configurations
  async saveConfigurations(configurations) {
    try {
      const response = await api.put('/configurations/bulk', { configurations });
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Delete configuration
  async deleteConfiguration(key) {
    try {
      const response = await api.delete(`/configurations/${key}`);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Initialize default configurations
  async initializeDefaults() {
    try {
      const response = await api.post('/configurations/init');
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Helper method to get configuration value by key
  async getConfigValue(key, defaultValue = null) {
    try {
      const response = await this.getConfiguration(key);
      if (response.success && response.data) {
        return this.parseConfigValue(response.data.value, response.data.type);
      }
      return defaultValue;
    } catch (error) {
      // Missing key → default. Network/server errors must not look like "empty"
      // or callers may overwrite stored config with defaults.
      if (error?.status === 404) {
        return defaultValue;
      }
      throw error;
    }
  },

  // Helper method to parse configuration value based on type
  parseConfigValue(value, type) {
    if (value === null || value === undefined) return null;
    
    switch (type) {
      case 'NUMBER':
      case 'CURRENCY':
      case 'PERCENTAGE':
        return parseFloat(value) || 0;
      case 'BOOLEAN':
        return value === 'true' || value === true;
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'STRING':
      default:
        return value;
    }
  },

  // Helper method to format configuration value for display
  formatConfigValue(value, type) {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'CURRENCY':
        return `GHS ${parseFloat(value).toFixed(2)}`;
      case 'PERCENTAGE':
        return `${parseFloat(value).toFixed(2)}%`;
      case 'BOOLEAN':
        return value ? 'Yes' : 'No';
      case 'JSON':
        return JSON.stringify(value, null, 2);
      default:
        return value.toString();
    }
  },

  // Get configurations by category
  async getConfigurationsByCategory(category) {
    try {
      const response = await this.getConfigurations();
      if (response.success && response.data[category]) {
        return response.data[category];
      }
      return [];
    } catch (error) {

      return [];
    }
  },

  // Get tax-related configurations
  async getTaxConfigurations() {
    return this.getConfigurationsByCategory('TAX');
  },

  // Get service charge configurations
  async getServiceConfigurations() {
    return this.getConfigurationsByCategory('SERVICE');
  },

  // Get business configurations
  async getBusinessConfigurations() {
    return this.getConfigurationsByCategory('BUSINESS');
  },

  // Get invoice configurations
  async getInvoiceConfigurations() {
    return this.getConfigurationsByCategory('INVOICE');
  },

  // Get notification configurations
  async getNotificationConfigurations() {
    return this.getConfigurationsByCategory('NOTIFICATIONS');
  },

  // Get system configurations
  async getSystemConfigurations() {
    return this.getConfigurationsByCategory('SYSTEM');
  }
};

export default configurationService;
