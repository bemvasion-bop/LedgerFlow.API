# SpendSync - Role-Based Dashboard System

## Overview
A complete React frontend for the Expense & Reimbursement Management System with role-based access control.

## Features
- JWT-based authentication
- Role-based sidebar navigation
- Four distinct dashboards (Admin, Employee, Finance, Auditor)
- Real-time expense management
- Responsive design
- TypeScript support

## Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx          # Role-based navigation
│   │   └── dashboards/
│   │       ├── AdminDashboard.tsx
│   │       ├── EmployeeDashboard.tsx
│   │       ├── FinanceDashboard.tsx
│   │       └── AuditorDashboard.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx             # Authentication context
│   │   └── useExpenses.tsx         # Expense management
│   ├── services/
│   │   └── api.ts                  # Axios configuration
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   ├── utils/
│   │   └── helpers.ts              # Utility functions
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # Enhanced styling
│   └── index.tsx                   # Entry point
├── package.json
└── README.md
```

## Installation & Setup

1. Copy the `frontend/` folder to your React project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API base URL in `src/services/api.ts` if needed
4. Start the development server:
   ```bash
   npm start
   ```

## API Integration

The frontend integrates with the ASP.NET Core API endpoints:

- `GET /api/expenses` - Fetch expenses with filtering
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/{id}` - Update expense
- `PUT /api/expenses/{id}/approve` - Approve expense
- `PUT /api/expenses/{id}/reject` - Reject expense
- `PUT /api/expenses/{id}/reimburse` - Reimburse expense
- `GET /api/expenses/history/stats` - Get expense statistics

## Role-Based Features

### Admin Dashboard
- View all expenses and statistics
- System overview with key metrics
- Recent expense activity

### Employee Dashboard
- Submit new expenses
- View personal expense history
- Track approval status

### Finance Dashboard
- Approve/reject pending expenses
- Process reimbursements
- Financial overview and reporting

### Auditor Dashboard
- Read-only expense overview
- Category-wise analysis
- Approval and reimbursement tracking

## Security
- JWT token authentication
- Automatic token refresh
- Route protection based on roles
- Secure API communication

## Styling
- Modern, responsive design
- Gradient backgrounds
- Smooth animations and transitions
- Mobile-friendly layout