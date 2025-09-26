// Password validation utilities
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  
  if (!PASSWORD_PATTERN.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Middleware to validate password in request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validatePasswordMiddleware = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ 
      error: 'Password is required',
      details: 'Password field is missing from request body'
    });
  }
  
  const validation = validatePassword(password);
  
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: 'Password validation failed',
      details: validation.errors
    });
  }
  
  next();
};

module.exports = {
  validatePassword,
  validatePasswordMiddleware,
  PASSWORD_PATTERN,
  MIN_PASSWORD_LENGTH
};


