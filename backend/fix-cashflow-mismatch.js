const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCashflowMismatch() {
  try {
    console.log('🔍 Fixing cashflow data mismatch...\n');

    // Find the incorrect cashflow transaction
    const incorrectTransaction = await prisma.cashflowTransaction.findFirst({
      where: {
        amount: 78678,
        description: 'Expense: DRFGJHKL;YJHBGVJK'
      }
    });

    if (incorrectTransaction) {
      console.log('📋 Found incorrect transaction:');
      console.log(`   ID: ${incorrectTransaction.id}`);
      console.log(`   Current Amount: GH₵${incorrectTransaction.amount.toLocaleString()}`);
      console.log(`   Description: ${incorrectTransaction.description}`);

      // Update the amount to the correct value (23)
      const updatedTransaction = await prisma.cashflowTransaction.update({
        where: { id: incorrectTransaction.id },
        data: { amount: 23 }
      });

      console.log(`✅ Updated transaction amount to: GH₵${updatedTransaction.amount}`);

      // Verify the fix
      const allCashflow = await prisma.cashflowTransaction.findMany({
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          sourceType: true
        },
        orderBy: { transactionDate: 'desc' }
      });

      console.log('\n📊 Updated Cashflow Transactions:');
      allCashflow.forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.type} - GH₵${transaction.amount.toLocaleString()}`);
        console.log(`   Description: ${transaction.description}`);
        console.log(`   Source: ${transaction.sourceType}`);
        console.log('');
      });

      const totalOutflows = allCashflow.filter(t => t.type === 'OUTFLOW').reduce((sum, t) => sum + t.amount, 0);
      const totalInflows = allCashflow.filter(t => t.type === 'INFLOW').reduce((sum, t) => sum + t.amount, 0);
      const netCashflow = totalInflows - totalOutflows;

      console.log(`💰 Total Inflows: GH₵${totalInflows.toLocaleString()}`);
      console.log(`💸 Total Outflows: GH₵${totalOutflows.toLocaleString()}`);
      console.log(`📊 Net Cashflow: GH₵${netCashflow.toLocaleString()}`);

      console.log('\n✅ Data consistency restored!');
    } else {
      console.log('❌ Could not find the incorrect transaction');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCashflowMismatch();
