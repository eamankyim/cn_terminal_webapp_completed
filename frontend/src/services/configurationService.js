import api from './api';

/** Short-lived in-memory cache so dropdowns don't race / hang on every open. */
const listCache = new Map(); // key -> { list, expiresAt }
const CACHE_TTL_MS = 30_000;

function getCachedList(key) {
  const entry = listCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    listCache.delete(key);
    return null;
  }
  return entry.list;
}

function setCachedList(key, list) {
  listCache.set(key, {
    list: [...list],
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function invalidateCachedList(key) {
  listCache.delete(key);
}

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
      if (configData?.key) invalidateCachedList(configData.key);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Update multiple configurations
  async saveConfigurations(configurations) {
    try {
      const response = await api.put('/configurations/bulk', { configurations });
      (configurations || []).forEach((c) => {
        if (c?.key) invalidateCachedList(c.key);
      });
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Delete configuration
  async deleteConfiguration(key) {
    try {
      const response = await api.delete(`/configurations/${key}`);
      invalidateCachedList(key);
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

  /**
   * Get raw configuration row (includes isConfigured for sensitive keys).
   */
  async getConfigMeta(key) {
    try {
      const response = await this.getConfiguration(key);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (error?.status === 404) return null;
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

  /** Normalize a list of dropdown string values (trim, drop empties, dedupe). */
  normalizeStringList(list) {
    return [...new Set((list || []).map((t) => String(t).trim()).filter(Boolean))];
  },

  /**
   * Load a JSON string-list configuration.
   * Ensures defaults only when the key is missing — never overwrites custom values.
   * On network errors, returns defaults for UI only and does not write to the DB.
   */
  async loadStringList(key, defaults = [], meta = {}) {
    const cached = getCachedList(key);
    if (cached && cached.length > 0) {
      return cached;
    }

    const seeded = this.normalizeStringList(defaults);

    try {
      const stored = await this.getConfigValue(key, null);
      if (Array.isArray(stored) && stored.length > 0) {
        const list = this.normalizeStringList(stored);
        setCachedList(key, list);
        return list;
      }

      // Missing or empty: create-only ensure (safe under concurrency)
      const response = await api.post(`/configurations/${key}/ensure-list`, {
        defaults: seeded,
        category: meta.category || 'JOBS',
        description: meta.description || key,
      });
      const list = this.normalizeStringList(response?.data?.list ?? seeded);
      setCachedList(key, list);
      return list;
    } catch (error) {
      if (error?.status === 404) {
        try {
          const response = await api.post(`/configurations/${key}/ensure-list`, {
            defaults: seeded,
            category: meta.category || 'JOBS',
            description: meta.description || key,
          });
          const list = this.normalizeStringList(response?.data?.list ?? seeded);
          setCachedList(key, list);
          return list;
        } catch (_) {
          return seeded;
        }
      }
      // Network/server error — do not overwrite DB
      return seeded;
    }
  },

  async saveStringList(key, list, meta = {}) {
    invalidateCachedList(key);
    return this.saveConfiguration({
      key,
      value: JSON.stringify(this.normalizeStringList(list)),
      type: 'JSON',
      category: meta.category || 'JOBS',
      description: meta.description || key,
    });
  },

  /**
   * Append a custom value via atomic server merge (avoids lost-update races).
   * Returns { list, value, created }.
   */
  async addToStringList(key, value, defaults = [], meta = {}) {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      const latest = await this.loadStringList(key, defaults, meta);
      return { list: latest, value: '', created: false };
    }

    const response = await api.post(`/configurations/${key}/list-items`, {
      item: trimmed,
      defaults: this.normalizeStringList(defaults),
      category: meta.category || 'JOBS',
      description: meta.description || key,
    });

    const list = this.normalizeStringList(response?.data?.list || []);
    const resolvedValue = response?.data?.value || trimmed;
    const created = Boolean(response?.data?.created);
    setCachedList(key, list);
    return { list, value: resolvedValue, created };
  },

  /**
   * Merge many values into a list atomically (migration / harvest).
   */
  async mergeStringList(key, values, defaults = [], meta = {}) {
    const items = this.normalizeStringList(values);
    if (items.length === 0) {
      return this.loadStringList(key, defaults, meta);
    }

    const response = await api.post(`/configurations/${key}/list-items`, {
      items,
      defaults: this.normalizeStringList(defaults),
      category: meta.category || 'JOBS',
      description: meta.description || key,
    });
    const list = this.normalizeStringList(response?.data?.list || []);
    setCachedList(key, list);
    return list;
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
