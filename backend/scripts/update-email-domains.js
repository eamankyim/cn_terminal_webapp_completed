// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEmailDomains() {
  try {
    console.log('🔄 Updating email domains from test.com to cnterminal.com...');
    console.log('');

    // Get all users with test.com emails
    console.log('📋 Fetching users with test.com emails...');
    const usersWithTestEmails = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@test.com'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    console.log(`✅ Found ${usersWithTestEmails.length} users with @test.com emails`);
    console.log('');

    if (usersWithTestEmails.length === 0) {
      console.log('✅ No users with @test.com emails found. All emails are already correct!');
      return;
    }

    // Display users to update
    console.log('Users to update:');
    console.table(usersWithTestEmails.map(u => ({
      name: u.name,
      'old email': u.email,
      'new email': u.email.replace('@test.com', '@cnterminal.com')
    })));
    console.log('');

    // Update emails
    console.log('💾 Updating email domains...');
    
    let successCount = 0;
    let failCount = 0;

    for (const user of usersWithTestEmails) {
      const oldEmail = user.email;
      const newEmail = oldEmail.replace('@test.com', '@cnterminal.com');
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: newEmail }
        });
        console.log(`  ✅ ${user.name}: ${oldEmail} → ${newEmail}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ ${user.name}: Failed - ${error.message}`);
        failCount++;
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log('Users found:', usersWithTestEmails.length);
    console.log('✅ Successfully updated:', successCount);
    console.log('❌ Failed:', failCount);
    console.log('═'.repeat(80));
    console.log('');

    // Show final state
    console.log('📋 Fetching all users to verify...');
    const allUsers = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('');
    console.log('Current user emails:');
    console.table(allUsers);
    
    console.log('');
    console.log('✅ Email domain update completed!');

  } catch (error) {
    console.error('❌ Error updating email domains:');
    console.error(error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateEmailDomains()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });

