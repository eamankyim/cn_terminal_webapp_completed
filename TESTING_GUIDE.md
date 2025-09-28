# 🧪 System Testing Guide

## 📋 Test User Accounts Created

The following test accounts have been created with proper role assignments and permissions:

### 👑 **ADMIN Account**
- **Email:** `admin@test.com`
- **Password:** `Admin123!`
- **Role:** ADMIN
- **Permissions:** Full system access - can manage everything
- **Test Focus:** System administration, user management, permissions

### 👥 **STAFF Account**
- **Email:** `staff@test.com`
- **Password:** `Staff123!`
- **Role:** STAFF
- **Permissions:** Job and customer management
- **Test Focus:** Job creation, customer management, basic operations

### 💻 **IT Consultant Account**
- **Email:** `it@test.com`
- **Password:** `IT123!`
- **Role:** IT_CONSULTANT
- **Permissions:** System access and technical operations
- **Test Focus:** System configuration, technical features

### 🚛 **Driver Account**
- **Email:** `driver@test.com`
- **Password:** `Driver123!`
- **Role:** DRIVER
- **Permissions:** Job assignment and status updates
- **Test Focus:** Job status changes, driver-specific features

### 📦 **Warehouse Account**
- **Email:** `warehouse@test.com`
- **Password:** `Warehouse123!`
- **Role:** WAREHOUSE
- **Permissions:** Consignment and inventory management
- **Test Focus:** Warehouse operations, consignment tracking

### 📝 **Enquiry Officer Account**
- **Email:** `enquiry@test.com`
- **Password:** `Enquiry123!`
- **Role:** ENQUIRY_OFFICER
- **Permissions:** Enquiry management
- **Test Focus:** Customer enquiries, enquiry processing

### 📤 **Release Officer Account**
- **Email:** `release@test.com`
- **Password:** `Release123!`
- **Role:** RELEASE_OFFICER
- **Permissions:** Job release operations
- **Test Focus:** Job release workflow, document release

### 📋 **Review Officer Account**
- **Email:** `review@test.com`
- **Password:** `Review123!`
- **Role:** REVIEW_OFFICER
- **Permissions:** Document review
- **Test Focus:** Document review process, approval workflows

### 🧾 **Invoice Officer Account**
- **Email:** `invoice@test.com`
- **Password:** `Invoice123!`
- **Role:** INVOICE_OFFICER
- **Permissions:** Invoice management
- **Test Focus:** Invoice creation, payment processing

### ✅ **Clearing Officer Account**
- **Email:** `clearing@test.com`
- **Password:** `Clearing123!`
- **Role:** CLEARING_OFFICER
- **Permissions:** Job clearing operations
- **Test Focus:** Job clearing workflow, final status updates

---

## 🎯 Testing Checklist

### 1. **Authentication & Authorization Testing**
- [ ] Test login with each account
- [ ] Verify correct role assignment after login
- [ ] Test logout functionality
- [ ] Test session management
- [ ] Test unauthorized access attempts

### 2. **Permission Testing**
- [ ] **ADMIN:** Access all system features
- [ ] **STAFF:** Access job and customer management
- [ ] **DRIVER:** Access assigned jobs only
- [ ] **WAREHOUSE:** Access consignment features
- [ ] **ENQUIRY_OFFICER:** Access enquiry management
- [ ] **RELEASE_OFFICER:** Access release operations
- [ ] **REVIEW_OFFICER:** Access review workflows
- [ ] **INVOICE_OFFICER:** Access invoice features
- [ ] **CLEARING_OFFICER:** Access clearing operations
- [ ] **IT_CONSULTANT:** Access system configuration

### 3. **Core Feature Testing**

#### **Job Management**
- [ ] Create new jobs (STAFF/ADMIN)
- [ ] Assign jobs to drivers (STAFF/ADMIN)
- [ ] Update job status (DRIVER/STAFF/ADMIN)
- [ ] View job details (All roles)
- [ ] Job filtering and search

#### **Customer Management**
- [ ] Create customers (STAFF/ADMIN)
- [ ] Edit customer information (STAFF/ADMIN)
- [ ] View customer details (All roles)
- [ ] Customer search and filtering

#### **Accounting & Finance**
- [ ] **Expense Requests:**
  - [ ] Create expense requests (All roles)
  - [ ] Approve/reject requests (ADMIN/STAFF with permissions)
  - [ ] View expense statistics
- [ ] **Payout Records:**
  - [ ] Create payout records (ADMIN/STAFF with permissions)
  - [ ] View payout history
  - [ ] Payout filtering and search
- [ ] **Cashflow:**
  - [ ] View cashflow summary
  - [ ] Filter by date ranges
  - [ ] Export cashflow data

#### **Document Management**
- [ ] Upload documents (All roles)
- [ ] Download documents (All roles)
- [ ] Document approval workflow
- [ ] Document search and filtering

### 4. **Workflow Testing**

#### **Job Processing Workflow**
1. **STAFF** creates a new job
2. **STAFF** assigns job to **DRIVER**
3. **DRIVER** updates job status
4. **RELEASE_OFFICER** processes release
5. **CLEARING_OFFICER** clears the job

#### **Document Review Workflow**
1. **STAFF** uploads documents
2. **REVIEW_OFFICER** reviews documents
3. **RELEASE_OFFICER** approves release
4. **CLEARING_OFFICER** finalizes

#### **Expense Approval Workflow**
1. Any user creates expense request
2. **ADMIN** or authorized user approves/rejects
3. Expense is recorded in system

### 5. **UI/UX Testing**
- [ ] Navigation works correctly for each role
- [ ] Role-appropriate menus are shown
- [ ] Permission-based buttons appear/disappear
- [ ] Responsive design on different screen sizes
- [ ] Loading states and error handling

### 6. **API Testing**
- [ ] Test all API endpoints with different roles
- [ ] Verify permission enforcement on backend
- [ ] Test API error handling
- [ ] Test data validation

### 7. **Database Testing**
- [ ] Data integrity across all operations
- [ ] Foreign key relationships work correctly
- [ ] Permission assignments are stored properly
- [ ] Audit trails are maintained

---

## 🚨 **Important Testing Notes**

### **Permission Changes**
- You mentioned you'll be changing permissions for testing
- Make sure to test both before and after permission changes
- Document any permission modifications made

### **Role-Based Access Control**
- Each role should only see features they have permission for
- Test unauthorized access attempts (should be blocked)
- Verify that role changes take effect immediately

### **Data Isolation**
- Test that users only see data they should have access to
- Verify job assignments work correctly
- Test customer data access restrictions

### **Session Management**
- Test session timeout
- Test concurrent logins from same user
- Test session persistence across browser refreshes

---

## 🔧 **Testing Tools & Resources**

### **Frontend Testing**
- URL: `http://localhost:3000`
- Use different browsers for cross-browser testing
- Test on mobile devices for responsiveness

### **Backend Testing**
- API Documentation: `http://localhost:5000/api-docs`
- Test API endpoints directly using Swagger UI
- Use tools like Postman for advanced API testing

### **Database Testing**
- Use Prisma Studio: `http://localhost:5555`
- Verify data integrity and relationships
- Check permission assignments

---

## 📊 **Expected Test Results**

### **Success Criteria**
- ✅ All users can log in with correct credentials
- ✅ Role-based permissions work correctly
- ✅ No unauthorized access to restricted features
- ✅ All workflows complete successfully
- ✅ Data integrity maintained throughout testing
- ✅ UI responds correctly to permission changes
- ✅ API endpoints enforce proper authorization

### **Issues to Document**
- 🔍 Any permission bypasses found
- 🔍 UI elements not hiding/showing correctly
- 🔍 Workflow interruptions or errors
- 🔍 Performance issues during testing
- 🔍 Data inconsistencies or corruption

---

## 📝 **Test Reporting**

For each test case, document:
1. **Test Case:** What was tested
2. **User Role:** Which account was used
3. **Expected Result:** What should happen
4. **Actual Result:** What actually happened
5. **Status:** Pass/Fail/Blocked
6. **Notes:** Any observations or issues

---

**Happy Testing! 🚀**

Remember to test thoroughly and document any issues found. This comprehensive testing will help ensure the system is robust and secure for production use.
