require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createEntryOfficer() {
  try {
    console.log('🔷 Creating Entry Officer user...\n');

    const email = 'entry@cnterminal.com';
    const password = '111111@1A';
    const name = 'Entry Officer';
    const role = 'ENTRY_OFFICER';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  User already exists:', email);
      console.log('   Updating password...\n');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          role: role,
          isActive: true
        }
      });
      
      console.log('✅ User updated successfully!');
    } else {
      console.log('Creating new user...\n');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          isActive: true
        }
      });
      
      console.log('✅ Entry Officer created successfully!');
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', role);
    console.log('\n✅ You can now login with these credentials\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createEntryOfficer();

