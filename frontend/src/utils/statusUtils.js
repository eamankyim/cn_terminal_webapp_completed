// Centralized status utilities for consistent colors and icons across the app

// Job Status Color Progression (NEW → DELIVERED)
export const getJobStatusColor = (status, isDraft = false) => {
  if (isDraft) {
    return 'default';
  }
  
  const statusColors = {
    'NEW': 'blue',                  // Fresh start - blue for new beginnings
    'PREINVOICED': 'cyan',          // Preparation phase - cyan for preparation
    'INVOICED': 'processing',       // Invoice created - processing blue
    'VETTED': 'purple',             // Job vetted/reviewed - purple for review
    'ENTRY_COMPLETED': 'orange',    // Entry completed - orange for active work
    'DUTY_PAID': 'gold',            // Duty paid - gold for payment
    'READY_FOR_RELEASE': 'geekblue', // Ready for release - geekblue for coordination
    'RELEASED': 'lime',             // Almost complete - lime for near completion
    'CLEARED': 'green',             // Successfully processed - green for success
    'DELIVERED': 'success'          // Final completion - success green for delivery
  };
  
  return statusColors[status] || 'default';
};

// Invoice Status Colors
export const getInvoiceStatusColor = (status) => {
  const statusColors = {
    'PENDING': 'orange',     // Waiting for payment
    'PAID': 'green',         // Payment received
    'OVERDUE': 'red',        // Payment overdue
    'CANCELLED': 'default',  // Cancelled invoice
    'DRAFT': 'default'       // Draft invoice
  };
  
  return statusColors[status] || 'default';
};

// Customer Status Colors
export const getCustomerStatusColor = (status) => {
  const statusColors = {
    'ACTIVE': 'green',       // Active customer
    'INACTIVE': 'default',   // Inactive customer
    'SUSPENDED': 'red'       // Suspended customer
  };
  
  return statusColors[status] || 'default';
};

// Enquiry Status Colors
export const getEnquiryStatusColor = (status) => {
  const statusColors = {
    'SUBMITTED': 'blue',     // New enquiry
    'UNDER_REVIEW': 'orange', // Being reviewed
    'QUOTED': 'purple',      // Quote provided
    'CLOSED': 'default'      // Closed enquiry
  };
  
  return statusColors[status] || 'default';
};

// Invitation Status Colors
export const getInvitationStatusColor = (status) => {
  const statusColors = {
    'PENDING': 'orange',     // Waiting for response
    'ACCEPTED': 'green',     // Invitation accepted
    'EXPIRED': 'red',        // Invitation expired
    'CANCELLED': 'default'   // Invitation cancelled
  };
  
  return statusColors[status] || 'default';
};

// Job Status Icons
export const getJobStatusIcon = (status, isDraft = false) => {
  if (isDraft) {
    return '📄';
  }
  
  const statusIcons = {
    'NEW': '➕',                     // Plus for new
    'PREINVOICED': '📋',            // Clipboard for preparation
    'INVOICED': '🧾',               // Receipt for invoiced
    'VETTED': '✅',                 // Checkmark for vetted
    'ENTRY_COMPLETED': '📦',        // Package for entry completed
    'DUTY_PAID': '💰',              // Money for duty paid
    'READY_FOR_RELEASE': '🚗',     // Car for transport coordination
    'RELEASED': '🔓',               // Unlock for released
    'CLEARED': '✅',                // Check for cleared
    'DELIVERED': '🚚'               // Truck for delivered
  };
  
  return statusIcons[status] || '📄';
};

// Status Priority (for sorting)
export const getJobStatusPriority = (status) => {
  const priorities = {
    'NEW': 1,
    'PREINVOICED': 2,
    'INVOICED': 3,
    'VETTED': 4,
    'ENTRY_COMPLETED': 5,
    'DUTY_PAID': 6,
    'READY_FOR_RELEASE': 7,
    'RELEASED': 8,
    'CLEARED': 9,
    'DELIVERED': 10
  };
  
  return priorities[status] || 0;
};

// Status Description
export const getJobStatusDescription = (status) => {
  const descriptions = {
    'NEW': 'New job created',
    'PREINVOICED': 'Ready for invoicing',
    'INVOICED': 'Invoice issued for the job',
    'VETTED': 'Job has been vetted and reviewed',
    'ENTRY_COMPLETED': 'Customs entry completed',
    'DUTY_PAID': 'Duty payment completed',
    'READY_FOR_RELEASE': 'Assigned to release officer with documentation',
    'RELEASED': 'Released from customs',
    'CLEARED': 'Cleared and ready for delivery',
    'DELIVERED': 'Successfully delivered'
  };
  
  return descriptions[status] || 'Unknown status';
};

// Get all job statuses in order
export const getJobStatusesInOrder = () => {
  return ['NEW', 'PREINVOICED', 'INVOICED', 'VETTED', 'ENTRY_COMPLETED', 'DUTY_PAID', 'READY_FOR_RELEASE', 'RELEASED', 'CLEARED', 'DELIVERED'];
};

// Check if status is terminal (final state)
export const isTerminalStatus = (status) => {
  return ['DELIVERED', 'CANCELLED'].includes(status);
};

// Check if status allows editing
export const canEditJob = (status) => {
  return !['DELIVERED', 'CANCELLED'].includes(status);
};



