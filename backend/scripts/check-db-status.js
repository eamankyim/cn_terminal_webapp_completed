// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const roles = await prisma.role.count();
    const permissions = await prisma.permission.count();
    const users = await prisma.user.count();
    const rolePermissions = await prisma.rolePermission.count();
    
    console.log('\n📊 Database Status:');
    console.log('   Roles:', roles);
    console.log('   Permissions:', permissions);
    console.log('   Users:', users);
    console.log('   Role-Permission Mappings:', rolePermissions);
    
    if (roles > 0 && permissions > 0 && users > 0) {
      console.log('\n✅ Database appears to be seeded!');
    } else {
      console.log('\n⚠️  Database may need seeding.');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();

