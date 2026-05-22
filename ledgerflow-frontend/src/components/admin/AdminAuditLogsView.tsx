import React from 'react';
import AuditLogsView from '../audit/AuditLogsView';

// Admin uses the same audit logs view as Auditor
const AdminAuditLogsView: React.FC = () => {
  return <AuditLogsView />;
};

export default AdminAuditLogsView;
