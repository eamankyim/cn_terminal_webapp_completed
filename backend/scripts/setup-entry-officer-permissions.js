require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupEntryOfficerPermissions() {
  try {
    console.log('🔷 Setting up Entry Officer permissions...\n');

    // Get or create Entry Officer role
    let entryOfficerRole = await prisma.role.findFirst({
      where: { name: 'ENTRY_OFFICER' }
    });

    if (!entryOfficerRole) {
      console.log('Creating Entry Officer role...');
      entryOfficerRole = await prisma.role.create({
        data: {
          name: 'ENTRY_OFFICER',
          displayName: 'Entry Officer',
          description: 'Updates jobs to entry status and manages entry process',
          isSystem: true,
          isActive: true
        }
      });
      console.log('✅ Entry Officer role created');
    } else {
      console.log('✅ Entry Officer role already exists');
    }

    // Define permissions for Entry Officer
    const permissionNames = [
      'job:view',
      'job:edit',
      'job:update_status',
      'job:view_all',
      'customer:view',
      'customer:view_all',
      'dashboard:view',
      'reports:view',
      'file:upload',
      'file:download',
      'file:view',
      'notification:view',
      'expense:request',
      'expense:view'
    ];

    console.log('\nAssigning permissions...');
    
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found. Cannot assign permissions.');
      return;
    }
    
    let assigned = 0;
    let skipped = 0;

    for (const permName of permissionNames) {
      // Get permission
      const permission = await prisma.permission.findUnique({
        where: { name: permName }
      });

      if (!permission) {
        console.log(`⚠️  Permission not found: ${permName}`);
        continue;
      }

      // Check if already assigned
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: entryOfficerRole.id,
          permissionId: permission.id
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Assign permission
      await prisma.rolePermission.create({
        data: {
          roleId: entryOfficerRole.id,
          permissionId: permission.id,
          createdBy: adminUser.id
        }
      });
      
      console.log(`  ✅ Assigned: ${permName}`);
      assigned++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Assigned: ${assigned} permissions`);
    console.log(`   - Skipped (already assigned): ${skipped}`);
    console.log(`   - Total: ${permissionNames.length} permissions`);

    // Update Entry Officer user to use this role
    const entryUser = await prisma.user.findUnique({
      where: { email: 'entry@cnterminal.com' }
    });

    if (entryUser) {
      await prisma.user.update({
        where: { id: entryUser.id },
        data: { roleId: entryOfficerRole.id }
      });
      console.log(`\n✅ Linked entry@cnterminal.com to Entry Officer role`);
    }

    console.log('\n✅ Entry Officer permissions setup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEntryOfficerPermissions();

