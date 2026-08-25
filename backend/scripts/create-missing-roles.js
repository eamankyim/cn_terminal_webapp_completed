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
    name: 'PREINVOICE_OFFICER',
    displayName: 'Preinvoice Officer',
    description: 'Handles pre-invoicing tasks and prepares billing information',
    isSystem: true
  },
  {
    name: 'INVOICE_OFFICER',
    displayName: 'Invoice Officer',
    description: 'Issues invoices after pre-invoice and moves jobs to invoiced',
    isSystem: true
  },
  {
    name: 'SUPERVISOR',
    displayName: 'Supervisor',
    description: 'Assigns/reassigns jobs, comments, and attaches documents without changing status',
    isSystem: true
  },
  {
    name: 'REVIEW_OFFICER',
    displayName: 'Review Officer',
    description: 'Reviews and preinvoices jobs',
    isSystem: true
  },
  {
    name: 'CLEARING_OFFICER',
    displayName: 'Clearing Officer',
    description: 'Sets jobs to cleared status',
    isSystem: true
  },
  {
    name: 'ACCOUNTANT',
    displayName: 'Accountant',
    description: 'Manages expenses, payouts, and financial records',
    isSystem: true
  },
  {
    name: 'ENTRY_OFFICER',
    displayName: 'Entry Officer',
    description: 'Updates jobs to entry status and manages entry process',
    isSystem: true
  },
  {
    name: 'TRANSPORT_COORDINATOR',
    displayName: 'Transport Coordinator',
    description: 'Assigns jobs to release officers and uploads documentation',
    isSystem: true
  }
];

async function createMissingRoles() {
  try {
    // Get existing roles
    const existingRoles = await prisma.role.findMany({
      select: { name: true }
    });
    
    const existingRoleNames = existingRoles.map(r => r.name);
    // Find roles that need to be created
    const rolesToCreate = ROLES_TO_CREATE.filter(role => 
      !existingRoleNames.includes(role.name)
    );
    rolesToCreate.forEach(role => console.log(`  - ${role.name}: ${role.displayName}`));
    
    if (rolesToCreate.length === 0) {
      return;
    }
    
    // Create missing roles
    for (const roleData of rolesToCreate) {
      const role = await prisma.role.create({
        data: roleData
      });
    }
    // Show final role count
    const finalRoles = await prisma.role.findMany({
      select: { name: true, displayName: true }
    });
    finalRoles.forEach(role => {
    });
    
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

createMissingRoles();



