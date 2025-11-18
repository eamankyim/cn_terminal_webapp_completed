// Test if estimates table exists
require('dotenv').config();
const { prisma } = require('../config/database');

async function testEstimatesTable() {
  try {
    const count = await prisma.estimate.count();
    console.log('✅ Estimates table exists! Count:', count);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('   Code:', e.code);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testEstimatesTable();

