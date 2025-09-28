# CN Terminal App - Accounting & Finance Features Specification

## 📋 **1. OBJECTIVE**

Add comprehensive accounting and finance features to the CN Terminal App, with a focus on employee expense requests and approvals, payouts, cashflow tracking, and linkage to job invoices.

---

## 🎯 **2. FUNCTIONAL REQUIREMENTS**

### **2.1 Employee Expense Requests**

#### **Core Functionality**
- Employees can submit expense requests for various business expenses
- Examples: Fuel, supplies, transport, meals, accommodation, etc.

#### **Request Fields**
- **Amount** (required) - Expense amount in GHS
- **Category** (required) - Dropdown: Fuel, Materials, Operations, Miscellaneous
- **Description** (required) - Detailed description of expense
- **Date** (required) - Date of expense occurrence
- **Job Link** (optional) - Link to specific job if applicable
- **Receipt Upload** (optional) - File upload for receipt/documentation
- **Requested By** (auto-filled) - Current user
- **Request Date** (auto-filled) - Current timestamp

#### **Workflow Status**
1. **Pending** - Initial status when request is submitted
2. **Approved** - Finance Officer/Admin approves the request
3. **Rejected** - Finance Officer/Admin rejects the request

#### **Notifications**
- Finance Officer/Admin receives notification when new request is made
- Employee receives notification when request is approved/rejected

#### **Actions**
- Finance Officer can approve or reject requests
- Approved requests automatically move to expense records
- Rejected requests remain in request history with reason

---

### **2.2 Expenses Management (Approved Only)**

#### **Expense Records**
- Only approved requests become official expenses
- Cannot be edited once approved (audit trail)
- Linked to original request for traceability

#### **Categorization**
- **Fuel** - Vehicle fuel, gas, diesel
- **Materials** - Supplies, equipment, tools
- **Operations** - Operational costs, maintenance
- **Miscellaneous** - Other business expenses

#### **Job Linking**
- Optional link to specific jobs
- Enables job profitability calculations
- Shows in job financial summary

#### **Integration**
- Included in cashflow calculations
- Part of financial reporting
- Audit trail maintained

---

### **2.3 Payouts Management**

#### **Payout Types**
- Staff payments (non-payroll)
- Contractor payments
- Marketer commissions
- Third-party vendor payments
- Emergency payments

#### **Payout Fields**
- **Payee** (required) - Name of recipient
- **Amount** (required) - Payout amount in GHS
- **Payment Method** (required) - Bank transfer, Mobile money, Cash
- **Status** (required) - Pending, Completed, Failed
- **Purpose** (required) - Description of payout purpose
- **Job Link** (optional) - Link to specific job if applicable
- **Payment Date** (auto-filled) - When payment was made
- **Processed By** (auto-filled) - Finance Officer who processed

#### **Payment Methods**
- **Bank Transfer** - Direct bank account transfer
- **Mobile Money** - MTN, Vodafone, AirtelTigo
- **Cash** - Physical cash payment

#### **Status Tracking**
- **Pending** - Payment initiated, awaiting completion
- **Completed** - Payment successfully processed
- **Failed** - Payment failed, requires retry

---

### **2.4 Cashflow Tracking**

#### **Inflows**
- Job invoice payments (from existing invoice system)
- Other revenue streams
- Investment/loan proceeds

#### **Outflows**
- Approved expenses (from expense requests)
- Payouts (staff, contractors, vendors)
- Other business payments

#### **Dashboard Features**
- **Net Cashflow** - Real-time inflow vs outflow
- **Account Balance** - Calculated running balance
- **Trends** - Daily, weekly, monthly cashflow trends
- **Charts** - Visual representation of cashflow
- **Period Selection** - Custom date range filtering

#### **Calculations**
- **Daily Cashflow** = Daily Inflows - Daily Outflows
- **Running Balance** = Previous Balance + Current Cashflow
- **Period Totals** - Sum of selected period

---

### **2.5 Job Invoice Integration**

#### **Job Profitability**
- **Revenue** - Total invoice amount for job
- **Expenses** - Total expenses linked to job
- **Payouts** - Total payouts linked to job
- **Profit** = Revenue - Expenses - Payouts
- **Profit Margin** = (Profit / Revenue) × 100

#### **Job Financial Summary**
- Shows all financial transactions for specific job
- Expense breakdown by category
- Payout breakdown by type
- Profitability metrics

#### **Sync Integration**
- Automatic sync with existing invoice system
- Real-time updates when invoices are paid
- Historical data integration

---

### **2.6 Reporting Features**

#### **Expense Report**
- All approved expenses with request history
- Filter by date range, category, job, employee
- Export to PDF/Excel
- Summary totals and breakdowns

#### **Payout Report**
- All payouts with status tracking
- Filter by date range, payee, method, job
- Export to PDF/Excel
- Summary totals and breakdowns

#### **Cashflow Report**
- Inflows vs outflows by period
- Running balance over time
- Trend analysis
- Export to PDF/Excel

#### **Job Profitability Report**
- Revenue, expenses, payouts per job
- Profit margins and trends
- Top/bottom performing jobs
- Export to PDF/Excel

---

## 🔒 **3. NON-FUNCTIONAL REQUIREMENTS**

### **3.1 Security**
- All financial data encrypted at rest and in transit
- Secure file upload for receipts
- Audit trail for all financial transactions
- Data backup and recovery procedures

### **3.2 Role-Based Access Control**

#### **Employee Role**
- Submit expense requests
- View own request history
- Upload receipts
- View own approved expenses

#### **Finance Officer Role**
- Approve/reject expense requests
- Manage payouts
- View all financial data
- Generate reports
- Manage expense categories

#### **Admin Role**
- Full access to all features
- System configuration
- User role management
- Financial data management

### **3.3 User Experience**
- Responsive design for mobile and desktop
- Intuitive workflow for expense requests
- Real-time notifications
- Easy navigation between modules

### **3.4 Performance**
- Real-time updates for cashflow
- Fast report generation
- Efficient file upload handling
- Optimized database queries

---

## 📦 **4. DELIVERABLES**

### **4.1 Database Schema**
- Expense requests table
- Expenses table (approved requests)
- Payouts table
- Cashflow tracking table
- Job financial links table

### **4.2 Backend API**
- Expense request endpoints
- Expense management endpoints
- Payout management endpoints
- Cashflow calculation endpoints
- Reporting endpoints

### **4.3 Frontend Components**
- Expense request form
- Expense approval interface
- Payout management interface
- Cashflow dashboard
- Reporting interface

### **4.4 Workflow Implementation**
- Employee → Finance Officer approval workflow
- Notification system
- Status tracking
- Audit trail

### **4.5 Integration**
- Job invoice system integration
- Existing user system integration
- File upload system
- Notification system

---

## 🗂️ **5. DATABASE SCHEMA DESIGN**

### **5.1 Expense Requests Table**
```sql
CREATE TABLE expense_requests (
  id UUID PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  job_id UUID REFERENCES jobs(id),
  receipt_url VARCHAR(500),
  requested_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'PENDING',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **5.2 Expenses Table**
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES expense_requests(id),
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  job_id UUID REFERENCES jobs(id),
  receipt_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **5.3 Payouts Table**
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  payee VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  purpose TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id),
  payment_date TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **5.4 Cashflow Transactions Table**
```sql
CREATE TABLE cashflow_transactions (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL, -- 'INFLOW' or 'OUTFLOW'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  source_type VARCHAR(50), -- 'INVOICE', 'EXPENSE', 'PAYOUT'
  source_id UUID,
  job_id UUID REFERENCES jobs(id),
  transaction_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 **6. IMPLEMENTATION PHASES**

### **Phase 1: Core Infrastructure**
- Database schema creation
- Basic API endpoints
- Authentication integration
- File upload system

### **Phase 2: Expense Management**
- Expense request form
- Approval workflow
- Expense records management
- Basic notifications

### **Phase 3: Payouts Management**
- Payout creation and management
- Payment method handling
- Status tracking

### **Phase 4: Cashflow Tracking**
- Cashflow calculations
- Dashboard implementation
- Trend analysis

### **Phase 5: Reporting**
- Report generation
- Export functionality
- Job profitability integration

### **Phase 6: Integration & Testing**
- Job invoice integration
- End-to-end testing
- Performance optimization
- Security audit

---

## 📊 **7. SUCCESS METRICS**

- Expense request approval time < 24 hours
- 100% audit trail for all financial transactions
- Real-time cashflow updates
- Report generation time < 30 seconds
- 99.9% uptime for financial modules
- Zero data loss for financial transactions

---

**📝 Document Version: 1.0**  
**📅 Created: January 2025**  
**👤 Author: AI Assistant**  
**🔄 Status: Ready for Implementation**



