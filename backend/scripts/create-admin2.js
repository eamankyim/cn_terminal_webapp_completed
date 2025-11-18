// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin2() {
  try {
    console.log('Creating admin2 user...');

    // Admin user details
    const adminEmail = 'admin2@cnterminal.com';
    const adminPassword = '111111@1';
    const adminName = 'System Administrator 2';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists with email:', adminEmail);
      console.log('User ID:', existingAdmin.id);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Hash password with bcrypt (same as in the init route)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
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

    console.log('✅ Admin2 user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', admin.email);
    console.log('Password:', adminPassword);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('User ID:', admin.id);
    console.log('Created At:', admin.createdAt);
    console.log('-----------------------------------');
    console.log('You can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin2 user:');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdmin2()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });



