// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAllPasswords() {
  try {
    console.log('🔄 Resetting all user passwords...');
    console.log('New password for all users: 111111@1A');
    console.log('');

    const newPassword = '111111@1A';

    // Get all users
    console.log('📋 Fetching all users from database...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    console.log(`✅ Found ${allUsers.length} users`);
    console.log('');

    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Display all users
    console.log('Users to update:');
    console.table(allUsers);
    console.log('');

    // Hash the new password
    const saltRounds = 12;
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Password hashed:', hashedPassword.substring(0, 30) + '...');
    console.log('');

    // Update all users' passwords
    console.log('💾 Updating passwords for all users...');
    
    let successCount = 0;
    let failCount = 0;

    for (const user of allUsers) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log(`  ✅ ${user.name} (${user.email})`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ ${user.name} (${user.email}) - Error:`, error.message);
        failCount++;
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log('Total users:', allUsers.length);
    console.log('✅ Successfully updated:', successCount);
    console.log('❌ Failed:', failCount);
    console.log('');
    console.log('🔐 New password for ALL users: 111111@1A');
    console.log('═'.repeat(80));
    console.log('');
    console.log('✅ Password reset completed!');

    // Test one password to verify
    if (allUsers.length > 0) {
      console.log('');
      console.log('🧪 Testing password for first user...');
      const testResult = await bcrypt.compare(newPassword, hashedPassword);
      console.log('Password test result:', testResult ? '✅ VALID' : '❌ INVALID');
    }

  } catch (error) {
    console.error('❌ Error resetting passwords:');
    console.error(error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
resetAllPasswords()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });

