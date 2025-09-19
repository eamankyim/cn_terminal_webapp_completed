const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cnterminal.com' },
    update: {},
    create: {
      email: 'admin@cnterminal.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john.smith@example.com' },
      update: {},
      create: {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+233 20 123 4567',
        address: '123 Main Street, Accra',
        city: 'Accra',
        country: 'Ghana',
        customerType: 'REGULAR',
        status: 'ACTIVE'
      }
    }),
    prisma.customer.upsert({
      where: { email: 'sarah.johnson@example.com' },
      update: {},
      create: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+233 24 987 6543',
        address: '456 Oak Avenue, Kumasi',
        city: 'Kumasi',
        country: 'Ghana',
        customerType: 'PREMIUM',
        status: 'ACTIVE'
      }
    }),
    prisma.customer.upsert({
      where: { email: 'mike.wilson@example.com' },
      update: {},
      create: {
        name: 'Mike Wilson',
        email: 'mike.wilson@example.com',
        phone: '+233 26 555 1234',
        address: '789 Pine Road, Tema',
        city: 'Tema',
        country: 'Ghana',
        customerType: 'VIP',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log('✅ Customers created:', customers.length);

  // Create sample consignments
  const consignments = await Promise.all([
    prisma.consignment.upsert({
      where: { trackingId: 'TRK-2024-001' },
      update: {},
      create: {
        customerId: customers[0].id,
        trackingId: 'TRK-2024-001',
        consigneeName: 'John Smith',
        consigneePhone: '+233 20 123 4567',
        consigneeAddress: '123 Main Street, Accra',
        ghanaCard: 'GHA-123456789-0',
        tin: '123456789',
        goodsType: 'Electronics',
        status: 'RELEASE',
        value: 25000,
        date: new Date('2024-01-20')
      }
    }),
    prisma.consignment.upsert({
      where: { trackingId: 'TRK-2024-002' },
      update: {},
      create: {
        customerId: customers[0].id,
        trackingId: 'TRK-2024-002',
        consigneeName: 'John Smith',
        consigneePhone: '+233 20 123 4567',
        consigneeAddress: '123 Main Street, Accra',
        ghanaCard: 'GHA-123456789-0',
        tin: '123456789',
        goodsType: 'Textiles',
        status: 'DELIVERED',
        value: 15000,
        date: new Date('2024-01-15')
      }
    }),
    prisma.consignment.upsert({
      where: { trackingId: 'TRK-2024-003' },
      update: {},
      create: {
        customerId: customers[1].id,
        trackingId: 'TRK-2024-003',
        consigneeName: 'Sarah Johnson',
        consigneePhone: '+233 24 987 6543',
        consigneeAddress: '456 Oak Avenue, Kumasi',
        ghanaCard: 'GHA-987654321-0',
        tin: '987654321',
        goodsType: 'Textiles',
        status: 'DELIVERED',
        value: 18000,
        date: new Date('2024-01-15')
      }
    }),
    prisma.consignment.upsert({
      where: { trackingId: 'TRK-2024-004' },
      update: {},
      create: {
        customerId: customers[2].id,
        trackingId: 'TRK-2024-004',
        consigneeName: 'Mike Wilson',
        consigneePhone: '+233 26 555 1234',
        consigneeAddress: '789 Pine Road, Tema',
        ghanaCard: 'GHA-555123456-0',
        tin: '555123456',
        goodsType: 'Machinery',
        status: 'PENDING',
        value: 85000,
        date: new Date('2024-01-25')
      }
    })
  ]);

  console.log('✅ Consignments created:', consignments.length);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { trackingId: 'JOB-2024-001' },
      update: {},
      create: {
        customerId: customers[0].id,
        consignmentId: consignments[0].id,
        trackingId: 'JOB-2024-001',
        goodsType: 'Electronics',
        port: 'Tema Port',
        assignedTo: 'Clearing Agent A',
        status: 'ENTRY',
        createdById: adminUser.id
      }
    }),
    prisma.job.upsert({
      where: { trackingId: 'JOB-2024-002' },
      update: {},
      create: {
        customerId: customers[1].id,
        consignmentId: consignments[2].id,
        trackingId: 'JOB-2024-002',
        goodsType: 'Textiles',
        port: 'Accra Port',
        assignedTo: 'Clearing Agent B',
        status: 'CLEARED',
        createdById: adminUser.id
      }
    })
  ]);

  console.log('✅ Jobs created:', jobs.length);

  // Create sample enquiries
  const enquiries = await Promise.all([
    prisma.enquiry.upsert({
      where: { 
        customerId_goodsType: {
          customerId: customers[0].id,
          goodsType: 'Machinery'
        }
      },
      update: {},
      create: {
        customerId: customers[0].id,
        goodsType: 'Machinery',
        port: 'Tema Port',
        goodsDescription: 'Industrial equipment for manufacturing',
        status: 'NEW'
      }
    }),
    prisma.enquiry.upsert({
      where: { 
        customerId_goodsType: {
          customerId: customers[1].id,
          goodsType: 'Pharmaceuticals'
        }
      },
      update: {},
      create: {
        customerId: customers[1].id,
        goodsType: 'Pharmaceuticals',
        port: 'Accra Port',
        goodsDescription: 'Medical supplies and equipment',
        status: 'INVOICED'
      }
    })
  ]);

  console.log('✅ Enquiries created:', enquiries.length);

  // Create sample shipments
  const shipments = await Promise.all([
    prisma.shipment.upsert({
      where: { trackingId: 'SHP-2024-001' },
      update: {},
      create: {
        trackingId: 'SHP-2024-001',
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        customerPhone: '+233 20 123 4567',
        customerAddress: '123 Main Street, Accra',
        packageType: 'Document',
        packageWeight: 0.5,
        packageValue: 500,
        packageDescription: 'Important business documents',
        collectionAddress: '123 Main Street, Accra',
        deliveryAddress: '456 Business District, Accra',
        deliveryCity: 'Accra',
        recipientName: 'John Smith',
        recipientPhone: '+233 20 123 4567',
        serviceType: 'EXPRESS',
        status: 'BOOKED'
      }
    })
  ]);

  console.log('✅ Shipments created:', shipments.length);

  // Create sample invoices
  const emails = [
    'john.smith@example.com',
    'sarah.johnson@example.com',
    'mike.wilson@example.com'
  ];

  const customersData = await prisma.customer.findMany({
    where: { email: { in: emails } }
  });

  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-001',
        customerId: customersData[0].id,
        amount: 25000,
        issueDate: new Date('2024-01-25'),
        dueDate: new Date('2024-02-25'),
        status: 'PENDING',
        createdById: adminUser.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-002',
        customerId: customersData[1].id,
        amount: 18000,
        issueDate: new Date('2024-01-26'),
        dueDate: new Date('2024-02-26'),
        status: 'CLEARED',
        paymentDate: new Date('2024-01-27'),
        paymentMethod: 'BANK_TRANSFER',
        createdById: adminUser.id
      }
    })
  ]);

  console.log('✅ Invoices created:', invoices.length);

  // Create sample payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        invoiceId: invoices[1].id,
        amount: 18000,
        payer: 'Sarah Johnson',
        paymentMethod: 'BANK_TRANSFER',
        status: 'COMPLETED',
        createdById: adminUser.id
      }
    })
  ]);

  console.log('✅ Payments created:', payments.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



