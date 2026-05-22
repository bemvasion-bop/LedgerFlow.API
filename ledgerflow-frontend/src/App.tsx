import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard as AdminDashboard, Reports as AdminReportsPage, Settings as AdminSettings } from './pages/admin';
import { Dashboard as EmployeeDashboard, Settings as EmployeeSettings } from './pages/employee';
import { Dashboard as FinanceDashboard, Settings as FinanceSettings } from './pages/finance';
import { Dashboard as AuditorDashboard, Settings as AuditSettings } from './pages/audit';
import AuditExpenses from './components/audit/AuditExpenses';
import AuditCompliance from './components/audit/AuditCompliance';
import AuditLogsView from './components/audit/AuditLogsView';
import UserManagement from './components/admin/UserManagementModern';
import DepartmentManagement from './components/admin/DepartmentManagement';
import AdminExpenses from './components/admin/AdminExpenses';
import AdminAuditLogsView from './components/admin/AdminAuditLogsView';
import EmployeeSubmitExpense from './components/employee/EmployeeSubmitExpense';
import EmployeeMyExpenses from './components/employee/EmployeeMyExpenses';
import EmployeeReimbursements from './components/employee/EmployeeReimbursements';
import FinancePendingApprovals from './components/finance/FinancePendingApprovals';
import FinanceApprovedExpenses from './components/finance/FinanceApprovedExpenses';
import FinanceReimbursements from './components/finance/FinanceReimbursements';
import FinanceApprovalWorkflow from './components/finance/FinanceApprovalWorkflow';
import FinanceReports from './components/finance/FinanceReports';
import Login from './components/Login';
import RegisterCompany from './components/RegisterCompany';
import VerifyEmail from './components/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import LandingPage from './landing/pages/LandingPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui';
// Super Admin Imports
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { Dashboard as SuperAdminDashboard } from './pages/superadmin/Dashboard';
import { Companies } from './pages/superadmin/Companies';
import { Users as SuperAdminUsers } from './pages/superadmin/Users';
import { Subscriptions } from './pages/superadmin/Subscriptions';
import { AuditLogs as SuperAdminAuditLogs } from './pages/superadmin/AuditLogs';
import { Reports as SuperAdminReports } from './pages/superadmin/Reports';
import { Settings as SuperAdminSettings } from './pages/superadmin/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      {/* Landing Page - Public Route */}
      <Route
        path="/"
        element={user ? <RoleRedirect /> : <LandingPage />}
      />

      {/* Authentication Routes - No Sidebar */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />

      {/* Registration Routes */}
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="expenses" element={<AdminExpenses />} />
        <Route path="reimbursements" element={<FinanceReimbursements />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="audit" element={<AdminAuditLogsView />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      {/* Dashboard alias for admin */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* Employee Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['Employee']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="submit" element={<EmployeeSubmitExpense />} />
        <Route path="expenses" element={<EmployeeMyExpenses />} />
        <Route path="reimbursements" element={<EmployeeReimbursements />} />
        <Route path="settings" element={<EmployeeSettings />} />
      </Route>

      {/* Finance Routes */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute allowedRoles={['Finance']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FinanceDashboard />} />
        <Route path="pending" element={<FinancePendingApprovals />} />
        <Route path="approvals" element={<FinanceApprovalWorkflow />} />
        <Route path="approved" element={<FinanceApprovedExpenses />} />
        <Route path="reimbursements" element={<FinanceReimbursements />} />
        <Route path="reports" element={<FinanceReports />} />
        <Route path="settings" element={<FinanceSettings />} />
      </Route>

      {/* Audit Routes */}
      <Route
        path="/audit"
        element={
          <ProtectedRoute allowedRoles={['Audit']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AuditorDashboard />} />
        <Route path="expenses" element={<AuditExpenses />} />
        <Route path="compliance" element={<AuditCompliance />} />
        <Route path="logs" element={<AuditLogsView />} />
        <Route path="settings" element={<AuditSettings />} />
      </Route>

      {/* User Management (Admin) - Redirect old route */}
      <Route path="/users" element={<Navigate to="/admin/users" replace />} />
      
      {/* User Management (Admin) - Correct route */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserManagement />} />
      </Route>

      {/* Super Admin Routes */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={['SuperAdmin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
        <Route path="reports" element={<SuperAdminReports />} />
        <Route path="settings" element={<SuperAdminSettings />} />
      </Route>

      {/* Catch all - redirect to login or dashboard */}
      <Route path="*" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} replace />} />
    </Routes>
  );
}

export default App;