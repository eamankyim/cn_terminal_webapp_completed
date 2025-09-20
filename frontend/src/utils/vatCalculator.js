/**
 * VAT Calculation Utility
 * Handles dynamic VAT calculations based on configuration
 */

/**
 * Calculate VAT using the configured formula
 * @param {number} serviceCharge - The service charge amount
 * @param {Object} config - Configuration object containing VAT settings
 * @returns {number} - Calculated VAT amount
 */
export const calculateVAT = (serviceCharge, config) => {
  if (!serviceCharge || serviceCharge <= 0) {
    return 0;
  }

  // Get VAT configuration values
  const vatRate = parseFloat(config.VAT_RATE?.value || '15') / 100; // Convert percentage to decimal
  const servicePercentage = parseFloat(config.VAT_SERVICE_PERCENTAGE?.value || '6') / 100; // Convert percentage to decimal
  const calculationMethod = config.VAT_CALCULATION_METHOD?.value || 'FORMULA';

  if (calculationMethod === 'SIMPLE') {
    // Simple calculation: VAT = VAT_RATE * SERVICE_CHARGE
    return serviceCharge * vatRate;
  }

  // Formula calculation: VAT = VAT_RATE * (SERVICE_PERCENTAGE * SERVICE_CHARGE + SERVICE_CHARGE)
  // This is equivalent to: VAT = VAT_RATE * SERVICE_CHARGE * (1 + SERVICE_PERCENTAGE)
  const vatBase = serviceCharge * (1 + servicePercentage);
  const vatAmount = vatBase * vatRate;

  return Math.round(vatAmount * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate VAT for multiple service charges
 * @param {Object} charges - Object containing various charge amounts
 * @param {Object} config - Configuration object containing VAT settings
 * @returns {number} - Total calculated VAT amount
 */
export const calculateTotalVAT = (charges, config) => {
  const {
    serviceCharge = 0,
    clearanceCharges = 0,
    terminalCharges = 0,
    shippingCharges = 0,
    miscellaneous = 0
  } = charges;

  // Calculate VAT for each service charge
  const serviceVAT = calculateVAT(serviceCharge, config);
  const clearanceVAT = calculateVAT(clearanceCharges, config);
  const terminalVAT = calculateVAT(terminalCharges, config);
  const shippingVAT = calculateVAT(shippingCharges, config);
  const miscellaneousVAT = calculateVAT(miscellaneous, config);

  const totalVAT = serviceVAT + clearanceVAT + terminalVAT + shippingVAT + miscellaneousVAT;
  return Math.round(totalVAT * 100) / 100; // Round to 2 decimal places
};

/**
 * Get VAT calculation explanation
 * @param {number} serviceCharge - The service charge amount
 * @param {Object} config - Configuration object containing VAT settings
 * @returns {Object} - Explanation of the VAT calculation
 */
export const getVATExplanation = (serviceCharge, config) => {
  const vatRate = parseFloat(config.VAT_RATE?.value || '15');
  const servicePercentage = parseFloat(config.VAT_SERVICE_PERCENTAGE?.value || '6');
  const calculationMethod = config.VAT_CALCULATION_METHOD?.value || 'FORMULA';

  if (calculationMethod === 'SIMPLE') {
    return {
      method: 'Simple',
      formula: `VAT = ${vatRate}% × Service Charge`,
      calculation: `${vatRate}% × ${serviceCharge} = ${calculateVAT(serviceCharge, config)}`,
      result: calculateVAT(serviceCharge, config)
    };
  }

  // Formula method
  const servicePercentageAmount = serviceCharge * (servicePercentage / 100);
  const vatBase = serviceCharge + servicePercentageAmount;
  const vatAmount = calculateVAT(serviceCharge, config);

  return {
    method: 'Formula',
    formula: `VAT = ${vatRate}% × (${servicePercentage}% × Service Charge + Service Charge)`,
    breakdown: {
      serviceCharge: serviceCharge,
      servicePercentageAmount: servicePercentageAmount,
      vatBase: vatBase,
      vatRate: vatRate,
      vatAmount: vatAmount
    },
    calculation: `${vatRate}% × (${servicePercentage}% × ${serviceCharge} + ${serviceCharge}) = ${vatAmount}`,
    result: vatAmount
  };
};

/**
 * Validate VAT configuration
 * @param {Object} config - Configuration object containing VAT settings
 * @returns {Object} - Validation result
 */
export const validateVATConfig = (config) => {
  const errors = [];
  const warnings = [];

  const vatRate = parseFloat(config.VAT_RATE?.value || '0');
  const servicePercentage = parseFloat(config.VAT_SERVICE_PERCENTAGE?.value || '0');
  const calculationMethod = config.VAT_CALCULATION_METHOD?.value || 'FORMULA';

  if (vatRate <= 0 || vatRate > 100) {
    errors.push('VAT rate must be between 0 and 100');
  }

  if (servicePercentage < 0 || servicePercentage > 100) {
    errors.push('Service percentage must be between 0 and 100');
  }

  if (!['FORMULA', 'SIMPLE'].includes(calculationMethod)) {
    errors.push('VAT calculation method must be either FORMULA or SIMPLE');
  }

  if (vatRate > 50) {
    warnings.push('VAT rate seems unusually high');
  }

  if (servicePercentage > 50) {
    warnings.push('Service percentage seems unusually high');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  calculateVAT,
  calculateTotalVAT,
  getVATExplanation,
  validateVATConfig
};
