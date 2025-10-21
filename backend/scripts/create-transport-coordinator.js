require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTransportCoordinator() {
  console.log('🔷 Creating Transport Coordinator user...\n');

  const email = 'transport@cnterminal.com';
  const password = '111111@1A';
  const name = 'Transport Coordinator';
  const role = 'TRANSPORT_COORDINATOR';

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      console.log(`⚠️ User with email ${email} already exists. Skipping creation.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating new user...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isActive: true,
      },
    });

    console.log('✅ Transport Coordinator created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log('\n✅ You can now login with these credentials');
  } catch (error) {
    console.error('❌ Error creating Transport Coordinator:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTransportCoordinator();

