const { prisma } = require('../config/database');

/**
 * Middleware to check database connection health
 * and retry if connection is lost
 */
const checkDatabaseHealth = async (req, res, next) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('Database health check failed:', error);
    
    // Try to reconnect
    try {
      await prisma.$connect();
      console.log('✅ Database reconnected successfully');
      next();
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError);
      return res.status(503).json({
        error: 'Database temporarily unavailable',
        message: 'Please try again in a moment'
      });
    }
  }
};

module.exports = { checkDatabaseHealth };

