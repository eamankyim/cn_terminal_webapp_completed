/**
 * Shared Prisma select shapes for Job API responses.
 * Keep list / detail / status-update / edit / reassign aligned so UI fields
 * (BoE, shipper, terminal, etc.) never go missing after a mutation.
 */

const jobCustomerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  ghanaCard: true,
  tin: true
};

const jobConsignmentSelect = {
  id: true,
  trackingId: true,
  consigneeName: true,
  consigneePhone: true,
  status: true,
  ghanaCard: true,
  tin: true
};

const jobUserBriefSelect = {
  id: true,
  name: true
};

const jobAssigneeSelect = {
  id: true,
  name: true,
  email: true
};

const jobStatusHistorySelect = {
  orderBy: { date: 'desc' },
  include: {
    updatedByUser: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
};

/** All Job scalar columns used by the app. */
const jobScalarSelect = {
  id: true,
  trackingId: true,
  customerId: true,
  consignmentId: true,
  createdById: true,
  updatedById: true,
  assignedToId: true,
  status: true,
  isDraft: true,
  submittedDate: true,
  eta: true,
  demurrageFreeDays: true,
  releaseMoneyReceived: true,
  shipperName: true,
  invoiceNumber: true,
  boeNumber: true,
  terminalName: true,
  scheduleTime: true,
  driverName: true,
  driverContact: true,
  demurrageType: true,
  createdAt: true,
  updatedAt: true,
  goodsTypes: true,
  mediumOfEnquiry: true,
  documentsBrought: true,
  containerNumber: true,
  blNumber: true,
  vesselName: true,
  line: true,
  jobDescription: true
};

/**
 * @param {object} [options]
 * @param {boolean} [options.includeDocuments]
 * @param {boolean} [options.includeInvoices]
 * @param {boolean} [options.includeCounts]
 */
function getJobSelect(options = {}) {
  const {
    includeDocuments = false,
    includeInvoices = false,
    includeCounts = false
  } = options;

  const select = {
    ...jobScalarSelect,
    customer: { select: jobCustomerSelect },
    consignment: { select: jobConsignmentSelect },
    createdBy: { select: jobUserBriefSelect },
    updatedBy: { select: jobUserBriefSelect },
    assignedTo: { select: jobAssigneeSelect },
    statusHistory: jobStatusHistorySelect
  };

  if (includeDocuments) {
    select.documents = {
      orderBy: { uploadedAt: 'desc' }
    };
  }

  if (includeInvoices) {
    select.invoices = {
      include: {
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    };
  }

  if (includeCounts) {
    select._count = {
      select: {
        documents: true,
        invoices: true
      }
    };
  }

  return select;
}

module.exports = {
  getJobSelect,
  jobCustomerSelect,
  jobConsignmentSelect,
  jobUserBriefSelect,
  jobAssigneeSelect,
  jobStatusHistorySelect,
  jobScalarSelect
};
