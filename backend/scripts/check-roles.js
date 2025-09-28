const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const roles = await prisma.role.findMany({
      select: { 
        name: true, 
        isSystem: true, 
        isActive: true,
        displayName: true
      }
    });
    
    console.log('Current roles:');
    roles.forEach(role => {
      console.log(`- ${role.name} (${role.displayName}): isSystem=${role.isSystem}, isActive=${role.isActive}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkRoles();


