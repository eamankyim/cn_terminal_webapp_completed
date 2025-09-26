const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test users data with proper roles and permissions
const testUsers = [
  {
    name: 'John Admin',
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'ADMIN',
    description: 'Full system administrator with all permissions'
  },
  {
    name: 'Sarah Manager',
    email: 'manager@test.com',
    password: 'Manager123!',
    role: 'MANAGER',
    description: 'Manager with job and customer management permissions'
  },
  {
    name: 'Mike Finance',
    email: 'finance@test.com',
    password: 'Finance123!',
    role: 'FINANCE_OFFICER',
    description: 'Finance officer with expense and payout permissions'
  },
  {
    name: 'Lisa Staff',
    email: 'staff@test.com',
    password: 'Staff123!',
    role: 'STAFF',
    description: 'Staff member with basic job and customer permissions'
  },
  {
    name: 'David Driver',
    email: 'driver@test.com',
    password: 'Driver123!',
    role: 'DRIVER',
    description: 'Driver with job assignment and status update permissions'
  },
  {
    name: 'Emma Warehouse',
    email: 'warehouse@test.com',
    password: 'Warehouse123!',
    role: 'WAREHOUSE_STAFF',
    description: 'Warehouse staff with consignment and inventory permissions'
  },
  {
    name: 'Tom Clearing',
    email: 'clearing@test.com',
    password: 'Clearing123!',
    role: 'CLEARING_OFFICER',
    description: 'Clearing officer with job clearing permissions'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users for system testing...\n');

  try {
    for (const userData of testUsers) {
      console.log(`Creating ${userData.role}: ${userData.name} (${userData.email})`);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`  ⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: true
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

      console.log(`  ✅ Created user: ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Password: ${userData.password}`);
      console.log(`     Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log('');
    }

    console.log('🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials Summary:');
    console.log('================================');
    
    testUsers.forEach(user => {
      console.log(`\n👤 ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Description: ${user.description}`);
    });

    console.log('\n🔧 Next Steps:');
    console.log('1. Test login with each account');
    console.log('2. Verify role-based permissions');
    console.log('3. Test different functionalities per role');
    console.log('4. Check if permissions are properly enforced');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUsers();
