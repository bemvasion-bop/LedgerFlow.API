# SpendSync / LedgerFlow Final System Reviewer

This reviewer explains what is inside the system, what each part does, and how the main modules work together. Use this as your main study guide for project defense, documentation, and system explanation.

## 1. System Overview

SpendSync, also named LedgerFlow in the backend project folder, is a web-based expense management and reimbursement system for companies. It allows employees to submit expenses, upload receipts, track approval status, and monitor reimbursements. Company administrators manage users, departments, reports, audit logs, and subscription settings. Finance users review expenses and process reimbursements. Auditors monitor records in read-only mode. A Super Admin manages the whole SaaS platform, including tenant companies and subscription requests.

The system follows a multi-tenant SaaS structure. This means many companies can use the same platform, but each company's data is separated using `CompanyId`.

## 2. Main Purpose Of The System

The system is designed to replace manual expense tracking with a centralized digital workflow. Its main purpose is to make expense submission, approval, reimbursement, reporting, and auditing easier, faster, and more transparent.

Main goals:

- Allow employees to submit expenses with descriptions, categories, amounts, and receipts.
- Allow admins and finance users to review, approve, reject, and reimburse expenses.
- Allow companies to manage users, roles, departments, and reports.
- Allow auditors to review activity and compliance without changing records.
- Allow the platform owner or Super Admin to manage companies, plans, and subscriptions.

## 3. Technology Stack

Backend:

- ASP.NET Core Web API using C#
- Entity Framework Core for database access and migrations
- SQL Server as the relational database
- JWT Bearer Authentication for secure login sessions
- BCrypt.Net for password hashing
- MailKit for email sending, OTP, and password reset messages

Frontend:

- React.js with TypeScript
- Axios for API communication
- React Router for page routing
- Tailwind CSS for styling
- Recharts for reports and charts
- jsPDF, jsPDF AutoTable, and XLSX for report export
- Lucide React and Heroicons for icons

Supporting tools:

- EF Core migrations for database schema changes
- Static file serving for receipt uploads
- CORS configuration for frontend-backend connection

## 4. Major User Roles

### Super Admin

The Super Admin manages the whole platform. This role can view all tenant companies, monitor platform activity, manage subscription requests, review audit logs, and access platform-wide reports.

Typical Super Admin screens:

- Platform Dashboard
- Company Management
- Platform Users
- Subscription Requests
- Audit Logs
- Platform Reports
- Settings

### Company Admin

The Company Admin manages one company inside the platform. This role manages users, departments, expenses, reports, audit logs, and company subscription settings.

Typical Admin screens:

- Admin Dashboard
- User Management
- Department Management, available mainly in Business Plan
- All Expenses
- Reimbursements
- Reports and Insights
- Audit Logs
- Settings

### Employee

The Employee submits and tracks personal expense claims. This role can create expenses, upload receipts, view status, and track reimbursement history.

Typical Employee screens:

- My Dashboard
- My Expenses
- Reimbursements

### Finance Manager

The Finance Manager reviews submitted expenses and processes reimbursements. This role focuses on approval, payment, and financial reporting.

Typical Finance screens:

- Finance Dashboard
- Pending Approvals
- Reimbursements
- Financial Reports

### Auditor

The Auditor has read-only access for monitoring and compliance. This role can inspect expenses, audit logs, and compliance status, but cannot create, edit, approve, reject, delete, or reimburse records.

Typical Auditor screens:

- Auditor Dashboard
- All Expenses
- Audit Logs
- Compliance Monitoring

## 5. Subscription Plans

The system supports two main plans: Starter and Business.

### Starter Plan

The Starter Plan is for small companies or teams that only need basic expense tracking.

Starter Plan includes:

- Up to 10 users
- Up to 100 expenses per month
- Expense submission
- Receipt uploads
- Basic dashboard
- Basic reports
- Audit logs
- Export support

Starter Plan is best for simple expense recording and monitoring.

### Business Plan

The Business Plan is for growing companies that need a more complete expense workflow.

Business Plan includes:

- Unlimited users
- Unlimited expenses
- Receipt uploads
- Advanced reports
- Advanced analytics
- Department analytics
- Finance and audit roles
- Role-based workflows
- Priority support

Business Plan is best for companies that need approvals, reimbursements, departments, advanced reporting, and stronger control.

## 6. Backend Folder Purpose

### Controllers

Controllers define API endpoints. They receive requests from the frontend and call services or database logic.

Important controllers:

- `AuthController.cs` handles login, logout, company registration, OTP verification, forgot password, and reset password.
- `ExpensesController.cs` handles expense creation, viewing, updating, deleting, approval, rejection, reimbursement, receipt upload, and expense statistics.
- `AdminUsersController.cs` handles company user management.
- `UserController.cs` handles user-related API actions.
- `DepartmentController.cs` handles department management.
- `ApprovalsController.cs` handles approval records and approval workflow.
- `CompaniesController.cs` handles company-related data.
- `SuperAdminController.cs` handles platform-wide Super Admin functions.
- `SubscriptionController.cs` handles subscription and plan-related actions.
- `SubscriptionRequestsController.cs` handles upgrade, downgrade, and cancellation requests.
- `ReportsController.cs` handles analytics and reports.
- `AuditController.cs` handles audit log viewing.
- `NotificationController.cs` handles user notifications.
- `CategoriesController.cs` handles expense categories.
- `PermissionsController.cs` handles role or permission-related checks.
- `PlansController.cs` and `PlanController.cs` handle subscription plans.
- `SeedController.cs` handles demo data or database seeding helpers.
- `UserSettingsController.cs` and `SuperAdminSettingsController.cs` handle profile and preference settings.

### Models

Models represent database tables and system entities.

Important models:

- `User.cs` stores user account details, login data, role, company, department, verification, and reset tokens.
- `Role.cs` stores roles such as SuperAdmin, Admin, Employee, Finance, and Audit.
- `Company.cs` stores tenant company details and subscription information.
- `Plan.cs` stores Starter and Business plan limits and features.
- `Department.cs` stores company departments.
- `Expense.cs` stores employee expense submissions.
- `Receipt.cs` stores uploaded receipt file information.
- `Category.cs` stores expense categories such as Travel, Meals, Office Supplies, Software, Utilities, and Other.
- `Approval.cs` stores approval or rejection records.
- `AuditLog.cs` stores system activity records.
- `Notification.cs` stores user notifications.
- `SubscriptionRequest.cs` stores plan upgrade or downgrade requests.
- `SubscriptionCancellationRequest.cs` stores cancellation requests.
- `SuperAdminSettings.cs` stores Super Admin preferences.

### DTOs

DTO means Data Transfer Object. DTOs define the shape of data sent between frontend and backend. They help avoid exposing full database models directly.

Examples:

- Login and registration DTOs
- Expense DTOs
- Company DTOs
- Department DTOs
- Subscription DTOs
- User management DTOs
- Super Admin DTOs
- User settings DTOs

### Services

Services contain business logic. Controllers call services to perform work.

Important services:

- `JwtService.cs` creates and validates JWT authentication tokens.
- `EmailService.cs` sends email messages using MailKit.
- `OtpService.cs` handles OTP verification codes.
- `ExpenseService.cs` handles expense-related logic.
- `UserService.cs` handles user account logic.
- `DepartmentService.cs` handles departments.
- `CompanyService.cs` handles tenant company operations.
- `ApprovalService.cs` handles approval workflow.
- `AuditLogService.cs` records actions for accountability.
- `ReportsService.cs` generates dashboard and report data.
- `SubscriptionService.cs` handles subscription logic.
- `NotificationService.cs` handles notifications.
- `PermissionService.cs` checks access and permissions.
- `PlanEnforcementService.cs` enforces Starter and Business plan limits.
- `SuperAdminService.cs` handles platform-level management.
- `DatabaseSeeder.cs` creates demo or starting data.

### Data

`AppDbContext.cs` is the Entity Framework Core database context. It defines the database tables using `DbSet` and configures relationships between entities.

Main tables:

- Plans
- Companies
- Users
- Roles
- Departments
- Expenses
- Receipts
- Categories
- Approvals
- AuditLogs
- Notifications
- SubscriptionRequests
- SubscriptionCancellationRequests
- SuperAdminSettings

### Middleware

Middleware runs during the request pipeline. The important custom middleware is subscription enforcement. It checks whether a company has an active subscription or valid trial before allowing access to protected parts of the system.

### Migrations

The `Migrations` folder contains EF Core migration files. These files define database schema changes over time, such as adding departments, approvals, subscription fields, and user status fields.

### Uploads

The `uploads` folder stores uploaded receipt files. The backend serves this folder through the `/uploads` URL path.

## 7. Frontend Folder Purpose

### ledgerflow-frontend

This is the main React frontend application for logged-in users. It contains dashboards and modules for Super Admin, Admin, Employee, Finance, and Auditor roles.

Main purposes:

- Display role-based dashboards
- Let users submit and manage expenses
- Let admins manage users and departments
- Let finance users approve and reimburse expenses
- Let auditors review logs and compliance
- Connect to the backend API using Axios

### landing-page and spendsync-landing

These folders contain landing page versions for the public marketing site. The landing page explains the product, features, pricing, FAQ, sign-in, and free trial onboarding.

## 8. Main System Workflow

### Registration and Onboarding

1. A company starts a free trial from the landing page.
2. The company enters company information and admin account details.
3. The system sends OTP or verification email.
4. After verification, the company admin can log in.
5. The company starts under a subscription plan such as Starter or Business.

### Login Workflow

1. User enters email and password.
2. Backend checks the account and hashed password.
3. If valid, backend issues a JWT token.
4. Frontend stores the token and sends it with future requests.
5. User sees screens based on role.

### Expense Workflow

1. Employee submits an expense.
2. Employee may upload a receipt.
3. Expense status starts as Pending.
4. Admin or Finance reviews the expense.
5. Expense can be Approved or Rejected.
6. Approved expenses can be marked for payment.
7. Finance processes reimbursement.
8. Employee can view reimbursement status.
9. Audit logs record important actions.

### Subscription Workflow

1. Company uses Starter or Business plan.
2. Plan limits are enforced by the system.
3. Admin can request subscription changes.
4. Super Admin reviews subscription requests.
5. Super Admin approves or rejects the request.
6. Company plan and limits are updated.

## 9. Important Security Features

Implemented security-related features include:

- JWT Bearer authentication
- BCrypt password hashing
- OTP email verification
- Password reset tokens with expiration
- Role-based access control
- Multi-tenant isolation using `CompanyId`
- Subscription enforcement middleware
- Plan-based feature limits
- Audit logging
- Global exception handling
- CORS restrictions for frontend access
- HTTPS redirection
- Receipt upload validation
- User and department active/inactive status handling

Security features not clearly implemented and should not be claimed unless added:

- Rate limiting
- Account lockout
- CSP security headers
- Full PII masking
- 14 predefined roles
- Legal compliance certification

## 10. Database Relationship Summary

Main relationships:

- One Plan can have many Companies.
- One Company can have many Users.
- One Company can have many Departments.
- One Role can have many Users.
- One Department can have many Users.
- One User can submit many Expenses.
- One Category can be used by many Expenses.
- One Expense can have many Receipts.
- One Expense can have many Approval records.
- One User can approve many Approval records.
- One User can have many Notifications.
- One User can have many AuditLogs.
- One Company can have many SubscriptionRequests.
- One Company can have many SubscriptionCancellationRequests.
- One Super Admin user can have one SuperAdminSettings record.

## 11. Key Seeded Data

The system seeds important starter data when the backend runs:

Plans:

- Starter
- Business

Roles:

- SuperAdmin
- Admin
- Employee
- Finance
- Audit

Categories:

- Travel
- Meals
- Office Supplies
- Software
- Utilities
- Other

Default Super Admin:

- Email: `superadmin@spendsync.com`
- Password: `SuperAdmin123!`

Use this only for testing/demo environments.

## 12. Screen Guide Summary

### Landing Page

Public page for visitors. It explains SpendSync features, pricing, FAQ, and provides Sign In and Start Free Trial actions.

### Login Screen

Allows registered users to sign in using email and password. Includes forgot password support.

### Start Free Trial Screen

Allows a new company to register and create its first admin account.

### Super Admin Dashboard

Shows platform-wide company, user, subscription, and request statistics.

### Company Management

Allows Super Admin to view and manage all tenant companies.

### Platform Users

Allows Super Admin to view users across companies.

### Subscription Requests

Allows Super Admin to review upgrade, downgrade, or cancellation requests.

### Admin Dashboard

Shows company-level expense totals, pending approvals, and recent expenses.

### User Management

Allows company admins to create users, assign roles, and manage account access.

### Department Management

Allows Business Plan admins to create and manage departments.

### All Expenses

Shows all company expense records with filtering and view actions.

### Employee Dashboard

Shows the employee's own expenses, pending claims, approvals, and reimbursements.

### My Expenses

Allows employees to submit and manage their own expenses.

### Finance Dashboard

Shows pending approvals, approved expenses, reimbursements, and total disbursed amount.

### Pending Approvals

Allows Finance to review submitted expenses before approving or rejecting.

### Reimbursements

Allows Finance or Admin to track and process approved expense payments.

### Reports

Shows expense summaries, trends, categories, and exportable reports.

### Audit Logs

Shows recorded system activities for accountability.

### Compliance Monitoring

Allows Auditor to check receipts, approvals, payments, and possible compliance issues.

### Settings

Shows profile, subscription, plan, security, and notification settings.

## 13. How To Explain The System In Defense

Simple explanation:

SpendSync is a multi-tenant expense management and reimbursement system. Employees submit expenses with receipts. Admins manage users, departments, and company settings. Finance reviews expenses and processes payments. Auditors monitor records and compliance. Super Admin manages all companies and subscriptions. The system uses ASP.NET Core Web API, SQL Server, Entity Framework Core, React TypeScript, JWT authentication, BCrypt password hashing, email verification, role-based access, and audit logging.

Short technical explanation:

The backend exposes REST API endpoints through ASP.NET Core controllers. Business logic is separated into services. Entity Framework Core maps C# models to SQL Server tables through `AppDbContext`. Authentication uses JWT tokens, while passwords are hashed using BCrypt. The frontend is built with React and TypeScript and communicates with the API using Axios. User access is controlled by role and company subscription plan.

## 14. Files You Should Know

Most important backend files:

- `Program.cs` - configures services, authentication, CORS, middleware, migrations, and seed data.
- `Data/AppDbContext.cs` - defines database tables and relationships.
- `Controllers/AuthController.cs` - login, registration, OTP, password reset.
- `Controllers/ExpensesController.cs` - expense workflow.
- `Controllers/SuperAdminController.cs` - platform management.
- `Controllers/ReportsController.cs` - reporting and analytics.
- `Services/JwtService.cs` - token generation.
- `Services/EmailService.cs` - email sending.
- `Services/PlanEnforcementService.cs` - plan limits.
- `Models/User.cs`, `Models/Expense.cs`, `Models/Company.cs`, `Models/Plan.cs` - core database entities.

Most important frontend folder:

- `ledgerflow-frontend/src` - main React application source code.

## 15. Final Notes

This system is not just an expense form. It is a role-based, multi-tenant SaaS expense management platform with subscription plans, approval workflow, reimbursement tracking, reports, audit logs, and compliance monitoring.
