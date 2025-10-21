require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PERMISSIONS } = require('../utils/permissions');

const prisma = new PrismaClient();

async function setupTransportCoordinatorPermissions() {
  console.log('🔷 Setting up Transport Coordinator permissions...\n');

  try {
    // Get or create Transport Coordinator role
    let transportRole = await prisma.role.findFirst({
      where: { name: 'TRANSPORT_COORDINATOR' }
    });

    if (!transportRole) {
      console.log('Creating Transport Coordinator role...');
      transportRole = await prisma.role.create({
        data: {
          name: 'TRANSPORT_COORDINATOR',
          displayName: 'Transport Coordinator',
          description: 'Assigns jobs to release officers and uploads documentation',
          isSystem: true,
          isActive: true,
        },
      });
      console.log('✅ Transport Coordinator role created');
    } else {
      console.log('✅ Transport Coordinator role already exists');
    }

    // Define permissions for Transport Coordinator
    const permissionNames = [
      PERMISSIONS.JOB_VIEW,
      PERMISSIONS.JOB_EDIT,
      PERMISSIONS.JOB_ASSIGN,
      PERMISSIONS.JOB_UPDATE_STATUS,
      PERMISSIONS.JOB_VIEW_ALL,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_VIEW_ALL,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.FILE_UPLOAD,
      PERMISSIONS.FILE_DOWNLOAD,
      PERMISSIONS.FILE_VIEW,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.EXPENSE_REQUEST,
      PERMISSIONS.EXPENSE_VIEW
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
      // Skip if permName is undefined
      if (!permName) {
        console.log(`⚠️  Skipping undefined permission`);
        continue;
      }

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
          roleId: transportRole.id,
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
          roleId: transportRole.id,
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

    // Link the transport@cnterminal.com user to this role
    const transportUser = await prisma.user.findUnique({ where: { email: 'transport@cnterminal.com' } });
    if (transportUser && transportUser.role !== 'TRANSPORT_COORDINATOR') {
      await prisma.user.update({
        where: { id: transportUser.id },
        data: { role: 'TRANSPORT_COORDINATOR' }
      });
      console.log(`\n✅ Linked ${transportUser.email} to Transport Coordinator role`);
    } else if (transportUser && transportUser.role === 'TRANSPORT_COORDINATOR') {
      console.log(`\n✅ ${transportUser.email} is already linked to Transport Coordinator role`);
    } else {
      console.log(`\n⚠️ User transport@cnterminal.com not found. Please create the user first.`);
    }

    console.log('\n✅ Transport Coordinator permissions setup complete!');

  } catch (error) {
    console.error('❌ Error setting up Transport Coordinator permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTransportCoordinatorPermissions();

