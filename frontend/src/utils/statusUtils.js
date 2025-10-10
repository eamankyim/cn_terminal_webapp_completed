// Centralized status utilities for consistent colors and icons across the app

// Job Status Color Progression (NEW → DELIVERED)
export const getJobStatusColor = (status, isDraft = false) => {
  if (isDraft) {
    return 'default';
  }
  
  const statusColors = {
    'NEW': 'blue',           // Fresh start - blue for new beginnings
    'PREINVOICED': 'cyan',   // Preparation phase - cyan for preparation
    'INVOICED': 'purple',    // Financial processing - purple for financial
    'ENTRY': 'orange',       // Active processing - orange for active work
    'RELEASED': 'lime',      // Almost complete - lime for near completion
    'CLEARED': 'green',      // Successfully processed - green for success
    'DELIVERED': 'success'   // Final completion - success green for delivery
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
    'NEW': '➕',              // Plus for new
    'PREINVOICED': '📋',     // Clipboard for preparation
    'INVOICED': '💰',        // Money for invoiced
    'ENTRY': '📦',           // Package for entry
    'RELEASED': '🔓',        // Unlock for released
    'CLEARED': '✅',         // Check for cleared
    'DELIVERED': '🚚'        // Truck for delivered
  };
  
  return statusIcons[status] || '📄';
};

// Status Priority (for sorting)
export const getJobStatusPriority = (status) => {
  const priorities = {
    'NEW': 1,
    'PREINVOICED': 2,
    'INVOICED': 3,
    'ENTRY': 4,
    'RELEASED': 5,
    'CLEARED': 6,
    'DELIVERED': 7
  };
  
  return priorities[status] || 0;
};

// Status Description
export const getJobStatusDescription = (status) => {
  const descriptions = {
    'NEW': 'New job created',
    'PREINVOICED': 'Ready for invoicing',
    'INVOICED': 'Invoice generated',
    'ENTRY': 'Customs entry in progress',
    'RELEASED': 'Released from customs',
    'CLEARED': 'Cleared and ready for delivery',
    'DELIVERED': 'Successfully delivered'
  };
  
  return descriptions[status] || 'Unknown status';
};

// Get all job statuses in order
export const getJobStatusesInOrder = () => {
  return ['NEW', 'PREINVOICED', 'INVOICED', 'ENTRY', 'RELEASED', 'CLEARED', 'DELIVERED'];
};

// Check if status is terminal (final state)
export const isTerminalStatus = (status) => {
  return ['DELIVERED', 'CANCELLED'].includes(status);
};

// Check if status allows editing
export const canEditJob = (status) => {
  return !['DELIVERED', 'CANCELLED'].includes(status);
};



