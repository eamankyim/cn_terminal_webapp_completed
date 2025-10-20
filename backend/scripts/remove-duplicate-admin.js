// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeDuplicateAdmin() {
  try {
    console.log('🔄 Removing duplicate admin account...');
    console.log('');

    // Find the test admin account
    const testAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    if (!testAdmin) {
      console.log('✅ No duplicate admin found. Nothing to remove.');
      return;
    }

    console.log('Found duplicate admin:');
    console.log('  - Name:', testAdmin.name);
    console.log('  - Email:', testAdmin.email);
    console.log('  - ID:', testAdmin.id);
    console.log('');

    // Delete the duplicate admin
    console.log('🗑️  Deleting duplicate admin...');
    await prisma.user.delete({
      where: { id: testAdmin.id }
    });

    console.log('✅ Duplicate admin removed successfully!');
    console.log('');

    // Show remaining admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { name: true, email: true, isActive: true }
    });

    console.log('Remaining admin accounts:');
    console.table(admins);

  } catch (error) {
    console.error('❌ Error removing duplicate admin:');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
removeDuplicateAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });

