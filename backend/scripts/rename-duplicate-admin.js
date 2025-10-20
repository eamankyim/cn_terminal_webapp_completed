// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function renameDuplicateAdmin() {
  try {
    console.log('🔄 Renaming duplicate admin account...');
    console.log('');

    // Find the test admin account
    const testAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    if (!testAdmin) {
      console.log('✅ No duplicate admin found. Nothing to rename.');
      return;
    }

    console.log('Found duplicate admin:');
    console.log('  - Name:', testAdmin.name);
    console.log('  - Email:', testAdmin.email);
    console.log('  - ID:', testAdmin.id);
    console.log('');

    // Rename to johnadmin@cnterminal.com
    const newEmail = 'johnadmin@cnterminal.com';
    console.log('🔄 Renaming to:', newEmail);
    
    await prisma.user.update({
      where: { id: testAdmin.id },
      data: { email: newEmail }
    });

    console.log('✅ Admin account renamed successfully!');
    console.log('');

    // Show all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { name: true, email: true, isActive: true }
    });

    console.log('Current admin accounts:');
    console.table(admins);
    console.log('');
    console.log('All admins can login with password: 111111@1A');

  } catch (error) {
    console.error('❌ Error renaming admin:');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
renameDuplicateAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });

