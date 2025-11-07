const { PrismaClient } = require('@prisma/client');
const { seedUIPermissions } = require('../utils/uiPermissionSeeder');

const prisma = new PrismaClient();

async function main() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    const result = await seedUIPermissions(adminUser.id);

    console.log(`✅ Seeded ${result.permissionCount} UI permissions.`);
    console.log(`✅ Ensured ${result.assignmentsCreated} role UI permission assignments.`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to seed UI permissions:', error);
    process.exit(1);
  });