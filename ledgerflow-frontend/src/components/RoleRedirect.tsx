import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleRedirect: React.FC = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (token && role) {
    const normalizedRole = role.toLowerCase();
    
    // SuperAdmin gets redirected to Super Admin dashboard
    if (normalizedRole === 'superadmin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    
    // Regular roles
    if (['admin', 'employee', 'finance', 'audit'].includes(normalizedRole)) {
      return <Navigate to={`/${normalizedRole}`} replace />;
    }
  }

  return <Navigate to="/login" replace />;
};

export default RoleRedirect;
