const { prisma } = require('../config/database');

const OPEN_INVOICE_STATUSES = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'];

const invoicePaidTotal = (payments = []) =>
  payments
    .filter((payment) => payment.status !== 'FAILED' && payment.status !== 'CANCELLED')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

async function recordInvoicePayment({
  invoiceId,
  amount,
  paymentMethod,
  accountName,
  payer,
  createdById,
  receiptUrl,
  gatewayRef
}) {
  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    return { error: 'Amount must be greater than 0', status: 400 };
  }
  if (!paymentMethod || !payer) {
    return { error: 'Amount, payment method, and payer are required', status: 400 };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      payments: { select: { amount: true, status: true } }
    }
  });

  if (!invoice) {
    return { error: 'Invoice not found', status: 404 };
  }
  if (invoice.status === 'CANCELLED') {
    return { error: 'Cannot record payment on a cancelled invoice', status: 400 };
  }

  const alreadyPaid = invoicePaidTotal(invoice.payments);
  const remaining = Math.max(0, Number(invoice.amount) - alreadyPaid);
  if (remaining <= 0) {
    return { error: 'This invoice is already fully paid', status: 400 };
  }
  if (parsedAmount - remaining > 0.009) {
    return {
      error: `Amount exceeds remaining balance of GH₵${remaining.toFixed(2)}`,
      status: 400,
      remaining
    };
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: parsedAmount,
      paymentMethod,
      accountName: accountName ? String(accountName).trim() : null,
      payer,
      receiptUrl: receiptUrl || null,
      gatewayRef: gatewayRef || null,
      status: 'COMPLETED',
      createdById
    }
  });

  const totalPaid = alreadyPaid + parsedAmount;
  const fullyPaid = totalPaid >= Number(invoice.amount) - 0.009;
  const nextStatus = fullyPaid ? 'PAID' : 'PARTIALLY_PAID';

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: nextStatus,
      paymentDate: fullyPaid ? new Date() : invoice.paymentDate,
      paymentMethod
    }
  });

  await prisma.cashflowTransaction.create({
    data: {
      type: 'INFLOW',
      amount: parsedAmount,
      description: fullyPaid
        ? `Invoice payment (full): ${invoice.invoiceNumber}`
        : `Invoice payment (partial): ${invoice.invoiceNumber}`,
      sourceType: 'INVOICE',
      sourceId: invoice.id,
      jobId: invoice.jobId
    }
  });

  return {
    payment,
    invoice: {
      ...invoice,
      status: nextStatus
    },
    remaining: Math.max(0, Number(invoice.amount) - totalPaid),
    paymentType: fullyPaid ? 'FULL' : 'PARTIAL'
  };
}

module.exports = {
  OPEN_INVOICE_STATUSES,
  invoicePaidTotal,
  recordInvoicePayment
};
