const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define all the roles that should exist in the system
const ROLES_TO_CREATE = [
  {
    name: 'STAFF',
    displayName: 'Staff Member',
    description: 'Staff member with job and customer management permissions',
    isSystem: true
  },
  {
    name: 'DRIVER',
    displayName: 'Driver',
    description: 'Driver with limited job access',
    isSystem: true
  },
  {
    name: 'IT_CONSULTANT',
    displayName: 'IT Consultant',
    description: 'IT consultant with system access permissions',
    isSystem: true
  },
  {
    name: 'ENQUIRY_OFFICER',
    displayName: 'Enquiry Officer',
    description: 'Creates jobs and manages customer enquiries',
    isSystem: true
  },
  {
    name: 'RELEASE_OFFICER',
    displayName: 'Release Officer',
    description: 'Updates jobs to released status, only sees assigned jobs',
    isSystem: true
  },
  {
    name: 'REVIEW_OFFICER',
    displayName: 'Review Officer',
    description: 'Reviews and preinvoices jobs',
    isSystem: true
  },
  {
    name: 'INVOICE_OFFICER',
    displayName: 'Invoice Officer',
    description: 'Creates and manages invoices',
    isSystem: true
  },
  {
    name: 'CLEARING_OFFICER',
    displayName: 'Clearing Officer',
    description: 'Sets jobs to cleared status',
    isSystem: true
  }
];

async function createMissingRoles() {
  console.log('🔧 Creating missing roles...\n');
  
  try {
    // Get existing roles
    const existingRoles = await prisma.role.findMany({
      select: { name: true }
    });
    
    const existingRoleNames = existingRoles.map(r => r.name);
    console.log('📋 Existing roles:', existingRoleNames);
    
    // Find roles that need to be created
    const rolesToCreate = ROLES_TO_CREATE.filter(role => 
      !existingRoleNames.includes(role.name)
    );
    
    console.log(`\n🔍 Roles to create: ${rolesToCreate.length}`);
    rolesToCreate.forEach(role => console.log(`  - ${role.name}: ${role.displayName}`));
    
    if (rolesToCreate.length === 0) {
      console.log('\n✅ All roles already exist!');
      return;
    }
    
    // Create missing roles
    for (const roleData of rolesToCreate) {
      console.log(`\n📝 Creating role: ${roleData.name}`);
      
      const role = await prisma.role.create({
        data: roleData
      });
      
      console.log(`  ✅ Created: ${role.name} (${role.displayName})`);
    }
    
    console.log('\n🎉 All missing roles created successfully!');
    
    // Show final role count
    const finalRoles = await prisma.role.findMany({
      select: { name: true, displayName: true }
    });
    
    console.log('\n📊 Final roles in database:');
    finalRoles.forEach(role => {
      console.log(`  - ${role.name}: ${role.displayName}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating missing roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingRoles();


