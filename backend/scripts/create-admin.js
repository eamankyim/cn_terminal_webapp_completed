// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // Admin user details
    const adminEmail = 'admin@cnterminal.com';
    const adminPassword = '111111@1A';
    const adminName = 'System Administrator';

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

    console.log('✅ Admin user created successfully!');
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
    console.error('❌ Error creating admin user:');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });

