const { PrismaClient } = require('@prisma/client');

async function testInvoiceQuery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing invoice query...');
    
    // Test the exact query from the invoice route
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        job: {
          select: {
            id: true,
            trackingId: true,
            goodsType: true,
            port: true,
            status: true
          }
        },
        shipment: {
          select: {
            id: true,
            trackingId: true,
            customerName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('✅ Invoice query successful');
    console.log('📊 Found invoices:', invoices.length);
    console.log('📄 Sample invoice:', JSON.stringify(invoices[0] || 'No invoices found', null, 2));
    
  } catch (error) {
    console.error('❌ Invoice query error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

testInvoiceQuery();
