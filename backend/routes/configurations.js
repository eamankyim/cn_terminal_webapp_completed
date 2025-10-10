const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
      { key: 'INVOICE_DUE_DAYS', value: '30', type: 'NUMBER', category: 'INVOICE', description: 'Default invoice due days' }
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
