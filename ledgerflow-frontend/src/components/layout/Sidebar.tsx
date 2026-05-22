import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getMenuItems = () => {
    switch (user.role) {
      case 'Admin':
        return [
          { path: '/admin',          label: 'Dashboard' },
          { path: '/users',          label: 'User Management' },
          { path: '/admin/expenses', label: 'All Expenses' },
          { path: '/admin/reports',  label: 'Reports & Analytics' },
          { path: '/admin/audit',    label: 'Audit Logs' },
        ];
      case 'Employee':
        return [
          { path: '/employee',          label: 'Dashboard' },
          { path: '/employee/expenses', label: 'My Expenses' },
          { path: '/employee/submit',   label: 'Submit Expense' },
        ];
      case 'Finance':
        return [
          { path: '/finance',               label: 'Dashboard' },
          { path: '/finance/approvals',     label: 'Approval Workflow' },
          { path: '/finance/pending',       label: 'Pending Approvals' },
          { path: '/finance/approved',      label: 'Approved Expenses' },
          { path: '/finance/reimbursements',label: 'Reimbursements' },
        ];
      case 'Audit':
        return [
          { path: '/audit',            label: 'Dashboard' },
          { path: '/audit/expenses',   label: 'All Expenses' },
          { path: '/audit/logs',       label: 'Audit Logs' },
          { path: '/audit/compliance', label: 'Compliance' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <h2>SpendSync</h2>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>{user.email}</strong></p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.role}</p>
      </div>

      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path + item.label}>
              <NavLink
                to={item.path}
                end
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <button
          onClick={logout}
          className="btn btn-danger"
          style={{ width: '100%' }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;