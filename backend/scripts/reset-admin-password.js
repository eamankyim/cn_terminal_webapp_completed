// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');

    const adminEmail = 'admin@cnterminal.com';
    const newPassword = '111111@1';

    // Find the admin user
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.log('❌ Admin user not found with email:', adminEmail);
      console.log('\nListing all users:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true }
      });
      console.table(allUsers);
      return;
    }

    console.log('✅ Admin user found:');
    console.log('  - ID:', admin.id);
    console.log('  - Name:', admin.name);
    console.log('  - Email:', admin.email);
    console.log('  - Role:', admin.role);

    // Hash the new password
    const saltRounds = 12;
    console.log('\n🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('  - New hash created:', hashedPassword.substring(0, 30) + '...');

    // Update the password
    const updatedAdmin = await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    console.log('\n✅ Password reset successfully!');
    console.log('-----------------------------------');
    console.log('Email:', updatedAdmin.email);
    console.log('Password:', newPassword);
    console.log('Updated At:', updatedAdmin.updatedAt);
    console.log('-----------------------------------');
    console.log('\n🎉 You can now login with these credentials!');

    // Test the password
    console.log('\n🧪 Testing password comparison...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password test result:', isValid ? '✅ VALID' : '❌ INVALID');

  } catch (error) {
    console.error('❌ Error resetting admin password:');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
resetAdminPassword()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });



