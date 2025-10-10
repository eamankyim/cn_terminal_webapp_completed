const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Add connection retry logic
prisma.$on('error', (e) => {

});

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();

  } catch (error) {

    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();

  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();

  process.exit(0);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();

});

module.exports = { prisma, testConnection };

