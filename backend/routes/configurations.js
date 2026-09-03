const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function normalizeStringList(list) {
  return [...new Set((list || []).map((t) => String(t).trim()).filter(Boolean))];
}

function parseJsonStringList(raw) {
  if (raw == null || raw === '') return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? normalizeStringList(parsed) : [];
  } catch {
    return [];
  }
}

// Get all configurations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const configurations = await prisma.configuration.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group configurations by category
    const groupedConfigs = configurations.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedConfigs
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch configurations',
      error: error.message
    });
  }
});

/**
 * Ensure a JSON string-list config exists.
 * Creates with defaults only when missing — never overwrites existing custom values.
 */
router.post('/:key/ensure-list', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const {
      defaults = [],
      category = 'JOBS',
      description
    } = req.body || {};
    const userId = req.user.id;
    const seeded = normalizeStringList(defaults);

    const existing = await prisma.configuration.findUnique({ where: { key } });
    if (existing) {
      return res.json({
        success: true,
        created: false,
        data: {
          key,
          list: parseJsonStringList(existing.value),
          configuration: existing
        }
      });
    }

    try {
      const configuration = await prisma.configuration.create({
        data: {
          key,
          value: JSON.stringify(seeded),
          type: 'JSON',
          category,
          description: description || key,
          isActive: true,
          updatedBy: userId
        }
      });

      return res.json({
        success: true,
        created: true,
        data: {
          key,
          list: seeded,
          configuration
        }
      });
    } catch (error) {
      // Concurrent create — return the row that won
      if (error.code === 'P2002') {
        const configuration = await prisma.configuration.findUnique({ where: { key } });
        return res.json({
          success: true,
          created: false,
          data: {
            key,
            list: parseJsonStringList(configuration?.value),
            configuration
          }
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('ensure-list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ensure configuration list',
      error: error.message
    });
  }
});

/**
 * Atomically append item(s) to a JSON string-list config.
 * Merges with defaults only when the config is missing.
 */
router.post('/:key/list-items', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const {
      items,
      item,
      defaults = [],
      category = 'JOBS',
      description
    } = req.body || {};
    const userId = req.user.id;

    const toAdd = normalizeStringList([
      ...(Array.isArray(items) ? items : []),
      ...(item != null ? [item] : [])
    ]);

    if (toAdd.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one list item is required'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.configuration.findUnique({ where: { key } });
      let list = existing
        ? parseJsonStringList(existing.value)
        : normalizeStringList(defaults);

      // If row exists but value was corrupt/empty, seed defaults then append
      if (existing && list.length === 0) {
        list = normalizeStringList(defaults);
      }

      const before = new Set(list.map((v) => v.toLowerCase()));
      const added = [];
      for (const value of toAdd) {
        if (!before.has(value.toLowerCase())) {
          list.push(value);
          before.add(value.toLowerCase());
          added.push(value);
        }
      }
      list = normalizeStringList(list);

      let configuration;
      if (existing) {
        configuration = await tx.configuration.update({
          where: { key },
          data: {
            value: JSON.stringify(list),
            type: 'JSON',
            category: category || existing.category || 'JOBS',
            description: description || existing.description || key,
            updatedBy: userId
          }
        });
      } else {
        configuration = await tx.configuration.create({
          data: {
            key,
            value: JSON.stringify(list),
            type: 'JSON',
            category,
            description: description || key,
            isActive: true,
            updatedBy: userId
          }
        });
      }

      return { list, added, configuration };
    });

    res.json({
      success: true,
      message: result.added.length
        ? 'List item(s) added successfully'
        : 'Item(s) already present in list',
      data: {
        key,
        list: result.list,
        added: result.added,
        created: result.added.length > 0,
        value: result.added[0] || toAdd[0],
        configuration: result.configuration
      }
    });
  } catch (error) {
    console.error('list-items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration list',
      error: error.message
    });
  }
});

// Get configuration by key
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const configuration = await prisma.configuration.findUnique({
      where: { key }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error.message
    });
  }
});

// Create or update configuration
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { key, value, type, category, description, isActive } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }

    // Check if configuration exists
    const existingConfig = await prisma.configuration.findUnique({
      where: { key }
    });

    let configuration;
    if (existingConfig) {
      // Update existing configuration
      configuration = await prisma.configuration.update({
        where: { key },
        data: {
          value: value.toString(),
          type: type || existingConfig.type,
          category: category || existingConfig.category,
          description: description || existingConfig.description,
          isActive: isActive !== undefined ? isActive : existingConfig.isActive,
          updatedBy: userId
        }
      });
    } else {
      // Create new configuration
      configuration = await prisma.configuration.create({
        data: {
          key,
          value: value.toString(),
          type: type || 'STRING',
          category: category || 'GENERAL',
          description,
          isActive: isActive !== undefined ? isActive : true,
          updatedBy: userId
        }
      });
    }

    res.json({
      success: true,
      message: existingConfig ? 'Configuration updated successfully' : 'Configuration created successfully',
      data: configuration
    });

    // Invalidate SMS config cache when SMS-related keys change
    if (key === 'SMS_NOTIFICATIONS' || String(key).startsWith('SMS_')) {
      try {
        require('../services/smsService').invalidateConfigCache();
      } catch (_) { /* ignore */ }
    }
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
      error: error.message
    });
  }
});

// Update multiple configurations
router.put('/bulk', authenticateToken, async (req, res) => {
  try {
    const { configurations } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(configurations)) {
      return res.status(400).json({
        success: false,
        message: 'Configurations must be an array'
      });
    }

    const results = [];
    
    for (const config of configurations) {
      const { key, value, type, category, description, isActive } = config;
      
      if (!key || value === undefined) {
        results.push({
          key,
          success: false,
          message: 'Key and value are required'
        });
        continue;
      }

      try {
        const existingConfig = await prisma.configuration.findUnique({
          where: { key }
        });

        let configuration;
        if (existingConfig) {
          configuration = await prisma.configuration.update({
            where: { key },
            data: {
              value: value.toString(),
              type: type || existingConfig.type,
              category: category || existingConfig.category,
              description: description || existingConfig.description,
              isActive: isActive !== undefined ? isActive : existingConfig.isActive,
              updatedBy: userId
            }
          });
        } else {
          configuration = await prisma.configuration.create({
            data: {
              key,
              value: value.toString(),
              type: type || 'STRING',
              category: category || 'GENERAL',
              description,
              isActive: isActive !== undefined ? isActive : true,
              updatedBy: userId
            }
          });
        }

        results.push({
          key,
          success: true,
          data: configuration
        });
      } catch (error) {
        results.push({
          key,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk update completed',
      data: results
    });

    try {
      require('../services/smsService').invalidateConfigCache();
    } catch (_) { /* ignore */ }
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to bulk update configurations',
      error: error.message
    });
  }
});

// Delete configuration
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;

    const configuration = await prisma.configuration.findUnique({
      where: { key }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    await prisma.configuration.delete({
      where: { key }
    });

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: error.message
    });
  }
});

// Initialize default configurations
router.post('/init', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const defaultConfigs = [
      // Tax and VAT Settings (Essential for invoice calculations)
      { key: 'VAT_RATE', value: '15', type: 'PERCENTAGE', category: 'TAX', description: 'VAT rate (%)' },
      { key: 'VAT_SERVICE_PERCENTAGE', value: '6', type: 'PERCENTAGE', category: 'TAX', description: 'Percentage of service charge for VAT calculation (%)' },
      { key: 'VAT_CALCULATION_METHOD', value: 'FORMULA', type: 'STRING', category: 'TAX', description: 'VAT calculation method (FORMULA or SIMPLE)' },
      
      // Service Charges (Used in invoice forms)
      { key: 'DEFAULT_SERVICE_CHARGE', value: '50', type: 'CURRENCY', category: 'SERVICE', description: 'Default service charge (GHS)' },
      { key: 'DEFAULT_CLEARANCE_CHARGE', value: '25', type: 'CURRENCY', category: 'SERVICE', description: 'Default clearance charge (GHS)' },
      { key: 'DEFAULT_TERMINAL_CHARGE', value: '30', type: 'CURRENCY', category: 'SERVICE', description: 'Default terminal charge (GHS)' },
      { key: 'DEFAULT_SHIPPING_CHARGE', value: '40', type: 'CURRENCY', category: 'SERVICE', description: 'Default shipping charge (GHS)' },
      
      // Business Information (Used in invoices and reports)
      { key: 'COMPANY_NAME', value: 'CN Terminal', type: 'STRING', category: 'BUSINESS', description: 'Company name' },
      { key: 'COMPANY_ADDRESS', value: 'Accra, Ghana', type: 'STRING', category: 'BUSINESS', description: 'Company address' },
      { key: 'COMPANY_PHONE', value: '+233 123 456 789', type: 'STRING', category: 'BUSINESS', description: 'Company phone' },
      { key: 'COMPANY_EMAIL', value: 'info@cnterminal.com', type: 'STRING', category: 'BUSINESS', description: 'Company email' },
      
      // Invoice Settings (Essential for invoice generation)
      { key: 'INVOICE_PREFIX', value: 'INV', type: 'STRING', category: 'INVOICE', description: 'Invoice number prefix' },
      { key: 'INVOICE_DUE_DAYS', value: '30', type: 'NUMBER', category: 'INVOICE', description: 'Default invoice due days' },

      // Job form dropdown options (persisted so custom "Other" values survive across users/sessions)
      {
        key: 'GOODS_TYPES',
        value: JSON.stringify([
          'Electronics', 'Textiles', 'Machinery', 'Pharmaceuticals', 'Food & Beverages',
          'Automotive', 'Furniture', 'Clothing & Accessories', 'Books & Media',
          'Sports & Recreation', 'Health & Beauty', 'Tools & Hardware'
        ]),
        type: 'JSON',
        category: 'JOBS',
        description: 'Available goods types for job forms'
      },
      {
        key: 'VESSEL_NAMES',
        value: JSON.stringify([
          'RHL Concordia', 'MAERSK TEMA', 'Seaspan Dalian', 'MAERSK KARUN',
          'MAESK Cunene', 'Hammonia Toscan'
        ]),
        type: 'JSON',
        category: 'JOBS',
        description: 'Available vessel names for job forms'
      },
      {
        key: 'SHIPPING_LINES',
        value: JSON.stringify(['PIL', 'SAF', 'COSCO', 'CMA', 'OOCL', 'MSK', 'ONE']),
        type: 'JSON',
        category: 'JOBS',
        description: 'Available shipping lines for job forms'
      },
      {
        key: 'TERMINAL_NAMES',
        value: JSON.stringify(['Golden Jubilee', 'MPS', 'TBT', 'Terminal 2']),
        type: 'JSON',
        category: 'JOBS',
        description: 'Available terminal names for RELEASED status'
      },

      // SMS notification toggles & thresholds (MNotify)
      ...require('../services/smsConfig').SMS_DEFAULT_CONFIGS
    ];

    const results = [];
    
    for (const config of defaultConfigs) {
      try {
        const existingConfig = await prisma.configuration.findUnique({
          where: { key: config.key }
        });

        if (!existingConfig) {
          await prisma.configuration.create({
            data: {
              ...config,
              updatedBy: userId
            }
          });
          results.push({ key: config.key, action: 'created' });
        } else {
          results.push({ key: config.key, action: 'skipped' });
        }
      } catch (error) {
        results.push({ key: config.key, action: 'error', error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Default configurations initialized',
      data: results
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to initialize configurations',
      error: error.message
    });
  }
});

module.exports = router;
