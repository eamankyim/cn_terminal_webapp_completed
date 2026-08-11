const { prisma } = require('../config/database');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('./permissions');
const { seedUIPermissions } = require('./uiPermissionSeeder');

// Role information mapping for seeding
const ROLE_INFO = {
  ADMIN: {
    displayName: 'Administrator',
    description: 'Full system access including user management and system configuration',
    isSystem: true
  },
  IT_CONSULTANT: {
    displayName: 'IT Consultant',
    description: 'Full system access including user management and system configuration',
    isSystem: true
  },
  ENQUIRY_OFFICER: {
    displayName: 'Enquiry Officer',
    description: 'Creates jobs and manages customer enquiries',
    isSystem: true
  },
  ENTRY_OFFICER: {
    displayName: 'Entry Officer',
    description: 'Updates jobs to entry status and manages entry process',
    isSystem: true
  },
  TRANSPORT_COORDINATOR: {
    displayName: 'Transport Coordinator',
    description: 'Assigns jobs to release officers and uploads documentation',
    isSystem: true
  },
  RELEASE_OFFICER: {
    displayName: 'Release Officer',
    description: 'Can create jobs, customers, invoices, and release shipments',
    isSystem: true
  },
  PREINVOICE_OFFICER: {
    displayName: 'Preinvoice Officer',
    description: 'Handles pre-invoicing tasks and prepares billing information',
    isSystem: true
  },
  INVOICE_OFFICER: {
    displayName: 'Invoice Officer',
    description: 'Issues invoices after pre-invoice and moves jobs to invoiced',
    isSystem: true
  },
  REVIEW_OFFICER: {
    displayName: 'Review Officer',
    description: 'Reviews and preinvoices jobs',
    isSystem: true
  },
  VETTING_OFFICER: {
    displayName: 'Vetting Officer',
    description: 'Vets jobs and prepares them for invoicing',
    isSystem: true
  },
  CLEARING_OFFICER: {
    displayName: 'Clearing Officer',
    description: 'Can create jobs, customers, invoices, and clear shipments',
    isSystem: true
  },
  STAFF: {
    displayName: 'Staff Member',
    description: 'General staff member with standard permissions',
    isSystem: true
  },
  DRIVER: {
    displayName: 'Driver',
    description: 'Driver with transportation and delivery permissions',
    isSystem: true
  },
  ACCOUNTANT: {
    displayName: 'Accountant',
    description: 'Manages expenses, payouts, and financial records',
    isSystem: true
  }
};

// Permission module mapping
const PERMISSION_MODULES = {
  'user:': 'User',
  'job:': 'Job',
  'invoice:': 'Invoice',
  'customer:': 'Customer',
  'reports:': 'Reports',
  'analytics:': 'Analytics',
  'dashboard:': 'Dashboard',
  'settings:': 'Settings',
  'system:': 'System',
  'file:': 'File',
  'notification:': 'Notification',
  'expense:': 'Expense',
  'payout:': 'Payout',
  'cashflow:': 'Cashflow',
  'estimate:': 'Estimate'
};

// System settings to seed
const DEFAULT_SETTINGS = [
  {
    key: 'company_name',
    value: 'CN Terminal',
    type: 'STRING',
    category: 'COMPANY',
    description: 'Company name displayed throughout the application',
    isActive: true
  },
  {
    key: 'company_email',
    value: 'info@cnterminal.com',
    type: 'STRING',
    category: 'COMPANY',
    description: 'Company contact email address',
    isActive: true
  },
  {
    key: 'default_currency',
    value: 'GHS',
    type: 'CURRENCY',
    category: 'FINANCE',
    description: 'Default currency for pricing and invoicing',
    isActive: true
  },
  {
    key: 'timezone',
    value: 'Africa/Accra',
    type: 'STRING',
    category: 'SYSTEM',
    description: 'System timezone for date and time display',
    isActive: true
  }
];

/**
 * Check if roles are already seeded
 */
async function rolesExist() {
  const roleCount = await prisma.role.count({
    where: { isSystem: true }
  });
  return roleCount > 0;
}

/**
 * Check if settings are already seeded
 */
async function settingsExist() {
  const settingsCount = await prisma.configuration.count({
    where: {
      OR: [
        { key: 'company_name' },
        { key: 'company_email' },
        { key: 'default_currency' }
      ]
    }
  });
  return settingsCount > 0;
}

/**
 * Seed all system permissions
 */
async function seedPermissions() {
  console.log('🌱 Seeding permissions...');
  
  const permissionMap = {};
  
  for (const [key, permissionName] of Object.entries(PERMISSIONS)) {
    // Determine module based on permission name
    let module = 'System';
    for (const [prefix, moduleName] of Object.entries(PERMISSION_MODULES)) {
      if (permissionName.startsWith(prefix)) {
        module = moduleName;
        break;
      }
    }
    
    // Create permission description
    const description = permissionName.replace(':', ' ').replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
    
    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {
        description,
        module
      },
      create: {
        name: permissionName,
        description,
        module
      }
    });
    
    permissionMap[permissionName] = permission.id;
  }
  
  console.log(`✅ Seeded ${Object.keys(permissionMap).length} permissions`);
  return permissionMap;
}

/**
 * Seed all system roles
 */
async function seedRoles(creatorId) {
  console.log('🌱 Seeding roles...');
  
  const roleMap = {};
  
  for (const [roleName, info] of Object.entries(ROLE_INFO)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        displayName: info.displayName,
        description: info.description,
        isSystem: info.isSystem
      },
      create: {
        name: roleName,
        displayName: info.displayName,
        description: info.description,
        isSystem: info.isSystem
      }
    });
    
    roleMap[roleName] = role.id;
    console.log(`  ✅ ${roleName}: ${info.displayName}`);
  }
  
  console.log(`✅ Seeded ${Object.keys(roleMap).length} roles`);
  return roleMap;
}

/**
 * Seed role-permission mappings
 */
async function seedRolePermissions(roleMap, permissionMap, creatorId) {
  console.log('🌱 Assigning permissions to roles...');
  
  let totalAssigned = 0;
  
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    if (!roleMap[roleName]) {
      console.log(`⚠️  Role ${roleName} not found, skipping...`);
      continue;
    }
    
    let assigned = 0;
    
    for (const permissionName of permissions) {
      if (!permissionMap[permissionName]) {
        console.log(`⚠️  Permission ${permissionName} not found, skipping...`);
        continue;
      }
      
      try {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleMap[roleName],
              permissionId: permissionMap[permissionName]
            }
          },
          update: {}, // Don't update existing mappings
          create: {
            roleId: roleMap[roleName],
            permissionId: permissionMap[permissionName],
            createdBy: creatorId
          }
        });
        assigned++;
        totalAssigned++;
      } catch (error) {
        // Already exists, skip
      }
    }
    
    console.log(`  ✅ ${roleName}: ${assigned} permissions`);
  }
  
  console.log(`✅ Total permissions assigned: ${totalAssigned}`);
  return totalAssigned;
}

/**
 * Seed system settings
 */
async function seedSettings(creatorId) {
  console.log('🌱 Seeding system settings...');
  
  let seededCount = 0;
  
  for (const setting of DEFAULT_SETTINGS) {
    try {
      await prisma.configuration.upsert({
        where: { key: setting.key },
        update: {}, // Don't update existing settings
        create: {
          ...setting,
          updatedBy: creatorId
        }
      });
      seededCount++;
      console.log(`  ✅ ${setting.key}: ${setting.value}`);
    } catch (error) {
      // Already exists, skip
    }
  }
  
  console.log(`✅ Seeded ${seededCount} settings`);
  return seededCount;
}

/**
 * Auto-seed roles, permissions, and settings if they don't exist
 */
async function autoSeedIfNeeded(creatorId) {
  const rolesAlreadyExist = await rolesExist();
  const settingsAlreadyExist = await settingsExist();
  
  if (rolesAlreadyExist && settingsAlreadyExist) {
    console.log('📋 Roles, permissions, and settings already exist. Skipping auto-seed.');
    return {
      rolesSeeded: false,
      settingsSeeded: false,
      permissionsSeeded: false,
      message: 'System already initialized'
    };
  }
  
  console.log('🌱 Auto-seeding system data...');

  // Always seed permissions first (they're the foundation)
  const permissionMap = await seedPermissions();
  
  // Seed roles if needed
  let roleMap = {};
  let rolesCount = 0;
  if (!rolesAlreadyExist) {
    roleMap = await seedRoles(creatorId);
    rolesCount = Object.keys(roleMap).length;
    
    // Assign permissions to roles
    await seedRolePermissions(roleMap, permissionMap, creatorId);
  } else {
    // Still need role map for permission assignment
    const existingRoles = await prisma.role.findMany({
      where: { isSystem: true }
    });
    existingRoles.forEach(role => {
      roleMap[role.name] = role.id;
    });
  }
  
  // Seed settings if needed
  let settingsCount = 0;
  if (!settingsAlreadyExist) {
    settingsCount = await seedSettings(creatorId);
  }
  
  const uiSeedResult = creatorId ? await seedUIPermissions(creatorId) : { permissionCount: 0, assignmentsCreated: 0 };

  console.log(`✅ Auto-seeding complete:`);
  console.log(`   - Permissions: ${Object.keys(permissionMap).length}`);
  console.log(`   - Roles: ${rolesCount}`);
  console.log(`   - Settings: ${settingsCount}`);
  console.log(`   - UI Permissions: ${uiSeedResult.permissionCount}`);
  console.log(`   - UI Assignments Ensured: ${uiSeedResult.assignmentsCreated}`);
  
  return {
    rolesSeeded: !rolesAlreadyExist,
    settingsSeeded: !settingsAlreadyExist,
    permissionsSeeded: true,
    rolesCount,
    settingsCount,
    permissionsCount: Object.keys(permissionMap).length,
    uiPermissionsCount: uiSeedResult.permissionCount,
    message: `Successfully seeded ${Object.keys(permissionMap).length} permissions, ${rolesCount} roles, ${settingsCount} settings, and ensured UI permission assignments`
  };
}

/**
 * Ensure any missing system roles exist and have their default permissions.
 * Safe to run repeatedly (upserts role rows; adds missing role_permissions only).
 */
async function ensureMissingSystemRoles(creatorId) {
  const { ROLE_UI_PERMISSIONS, ALL_UI_PERMISSIONS } = require('./uiPermissions');

  const permissionMap = await seedPermissions();
  if (creatorId) {
    await seedUIPermissions(creatorId);
  }

  // Refresh permission map after UI permission seed
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, name: true }
  });
  const fullPermissionMap = {};
  allPermissions.forEach((p) => {
    fullPermissionMap[p.name] = p.id;
  });

  const roleMap = await seedRoles(creatorId);
  const results = [];

  for (const [roleName, roleId] of Object.entries(roleMap)) {
    const resourcePerms = ROLE_PERMISSIONS[roleName] || [];
    const uiPerms = ROLE_UI_PERMISSIONS[roleName] || ALL_UI_PERMISSIONS;
    const desired = [...new Set([...resourcePerms, ...uiPerms])];

    let added = 0;
    for (const permissionName of desired) {
      const permissionId = fullPermissionMap[permissionName];
      if (!permissionId) continue;
      try {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
            createdBy: creatorId
          }
        });
        added++;
      } catch (_) {
        // already assigned
      }
    }

    const count = await prisma.rolePermission.count({ where: { roleId } });
    results.push({ role: roleName, added, permissionCount: count });
  }

  return {
    success: true,
    roles: results,
    message: `Ensured ${results.length} system roles and permissions`
  };
}

module.exports = {
  seedPermissions,
  seedRoles,
  seedRolePermissions,
  seedSettings,
  seedRoleInfo: ROLE_INFO,
  rolesExist,
  settingsExist,
  autoSeedIfNeeded,
  ensureMissingSystemRoles
};

