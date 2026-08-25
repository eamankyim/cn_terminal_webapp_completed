// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// All user roles in the system
const USER_ROLES = [
  'ADMIN',
  'IT_CONSULTANT',
  'ENQUIRY_OFFICER',
  'ENTRY_OFFICER',
  'TRANSPORT_COORDINATOR',
  'RELEASE_OFFICER',
  'PREINVOICE_OFFICER',
  'INVOICE_OFFICER',
  'SUPERVISOR',
  'REVIEW_OFFICER',
  'CLEARING_OFFICER',
  'ACCOUNTANT',
  'STAFF',
  'DRIVER'
];

// Role display names
const ROLE_DISPLAY_NAMES = {
  'ADMIN': 'Administrator',
  'IT_CONSULTANT': 'IT Consultant',
  'ENQUIRY_OFFICER': 'Enquiry Officer',
  'ENTRY_OFFICER': 'Entry Officer',
  'TRANSPORT_COORDINATOR': 'Transport Coordinator',
  'RELEASE_OFFICER': 'Release Officer',
  'PREINVOICE_OFFICER': 'Preinvoice Officer',
  'INVOICE_OFFICER': 'Invoice Officer',
  'SUPERVISOR': 'Supervisor',
  'REVIEW_OFFICER': 'Review Officer',
  'CLEARING_OFFICER': 'Clearing Officer',
  'ACCOUNTANT': 'Accountant',
  'STAFF': 'Staff',
  'DRIVER': 'Driver'
};

async function createAllUserTypes() {
  try {
    console.log('🌱 Creating users for all role types...');
    console.log('='.repeat(80));
    
    const password = 'Testpassword123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const createdUsers = [];
    const skippedUsers = [];
    
    for (const role of USER_ROLES) {
      const email = `${role.toLowerCase().replace(/_/g, '.')}@cnterminal.com`;
      const name = ROLE_DISPLAY_NAMES[role] || role;
      
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        
        if (existingUser) {
          console.log(`⏭️  User already exists: ${email} (${role})`);
          skippedUsers.push({ email, role, name });
          continue;
        }
        
        // Get the role from database to link it
        const roleRecord = await prisma.role.findUnique({
          where: { name: role }
        });
        
        // Create user
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role,
            isActive: true,
            roleId: roleRecord?.id || null
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        });
        
        console.log(`✅ Created: ${email} (${role})`);
        createdUsers.push(user);
        
      } catch (error) {
        console.error(`❌ Failed to create ${role}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${createdUsers.length} users`);
    console.log(`   ⏭️  Skipped: ${skippedUsers.length} users (already exist)`);
    console.log('\n🔐 All users have password: Testpassword123');
    console.log('\n📋 Created Users:');
    createdUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    if (skippedUsers.length > 0) {
      console.log('\n⏭️  Skipped Users (already exist):');
      skippedUsers.forEach(({ email, role }) => {
        console.log(`   - ${email} (${role})`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAllUserTypes()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

