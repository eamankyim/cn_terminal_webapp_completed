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
    roles.forEach(role => {
    });
    
    await prisma.$disconnect();
  } catch (error) {
    await prisma.$disconnect();
  }
}

checkRoles();



