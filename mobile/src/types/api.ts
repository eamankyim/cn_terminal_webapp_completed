export type UserRole =
  | 'ADMIN'
  | 'STAFF'
  | 'ACCOUNTANT'
  | 'IT_CONSULTANT'
  | 'DRIVER'
  | 'ENQUIRY_OFFICER'
  | 'ENTRY_OFFICER'
  | 'TRANSPORT_COORDINATOR'
  | 'RELEASE_OFFICER'
  | 'PREINVOICE_OFFICER'
  | 'INVOICE_OFFICER'
  | 'SUPERVISOR'
  | 'REVIEW_OFFICER'
  | 'VETTING_OFFICER'
  | 'CLEARING_OFFICER'
  | string;

export type JobStatus =
  | 'NEW'
  | 'PREINVOICED'
  | 'INVOICED'
  | 'VETTED'
  | 'ENTRY'
  | 'ENTRY_COMPLETED'
  | 'DUTY_PAID'
  | 'READY_FOR_RELEASE'
  | 'RELEASE'
  | 'RELEASED'
  | 'CLEARED'
  | 'DELIVERED'
  | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions?: string[];
}

export interface AuthLoginResponse {
  user: User;
  token: string;
}

export interface InitCheckResponse {
  initialized: boolean;
}

export interface Paginated<TItem> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
    totalPages?: number;
  };
  items: TItem[];
}

export interface Job {
  id: string;
  trackingId: string;
  status: string;
  isDraft?: boolean;
  eta?: string | null;
  createdAt: string;
  shipperName?: string | null;
  invoiceNumber?: string | null;
  boeNumber?: string | null;
  terminalName?: string | null;
  scheduleTime?: string | null;
  driverName?: string | null;
  driverContact?: string | null;
  demurrageFreeDays?: number | null;
  releaseMoneyReceived?: boolean | null;
  demurrageType?: string | null;
  customer?: {
    id: string;
    name: string;
  };
  consignment?: {
    id: string;
    consigneeName?: string | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
  };
}

export interface JobsListResponse {
  jobs: Job[];
  pagination: {
    currentPage?: number;
    page?: number;
    totalPages?: number;
    pages?: number;
    totalCount?: number;
    total?: number;
    limit?: number;
  };
}

export interface JobComment {
  id: string;
  jobId: string;
  comment: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface JobCommentsResponse {
  comments: JobComment[];
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string | null;
  ghanaCard?: string | null;
  tin?: string | null;
  customerType?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomersListResponse {
  customers: Customer[];
  pagination: Paginated<Customer>['pagination'];
}

export interface Consignment {
  id: string;
  trackingId?: string | null;
  status: string;
  consigneeName?: string;
  consigneePhone?: string;
  consigneeAddress?: string;
  ghanaCard?: string | null;
  tin?: string | null;
  date?: string;
  customerId?: string;
  customer?: { id: string; name: string; email?: string; phone?: string };
}

export interface ExpenseRequest {
  id: string;
  amount: number;
  category: string;
  categoryOther?: string | null;
  description?: string;
  status: string;
  createdAt: string;
  requestedBy?: { id: string; name: string; email?: string; role?: string };
  approvedBy?: { id: string; name: string } | null;
  job?: { id: string; trackingId: string; status: string } | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  expiresAt: string;
  invitedByUser?: { name: string; email: string };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  customer?: Customer;
}

export interface InvoicesListResponse {
  invoices: Invoice[];
  pagination: Paginated<Invoice>['pagination'];
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  status: string;
  amount: number;
  issueDate: string;
  validUntil: string;
  customer?: Customer;
}

export interface EstimatesListResponse {
  estimates: Estimate[];
  pagination: Paginated<Estimate>['pagination'];
}

export interface Enquiry {
  id: string;
  customerId: string;
  commercialInvoice?: string | null;
  port: string;
  status: string;
  submittedDate?: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface EnquiriesListResponse {
  enquiries: Enquiry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}




