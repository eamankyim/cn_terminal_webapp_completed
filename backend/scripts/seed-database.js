// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { autoSeedIfNeeded } = require('../utils/seedUtils');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log('✅ Admin user found:', adminUser.email);
    
    // Auto-seed roles, permissions, and settings
    const seedResult = await autoSeedIfNeeded(adminUser.id);
    
    console.log('✅ Seeding complete!');
    console.log('   Result:', seedResult.message);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
seedDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

