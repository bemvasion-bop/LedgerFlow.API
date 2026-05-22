import React from 'react';
import { ProfileSection } from '../../components/settings/ProfileSection';
import { SecuritySection } from '../../components/settings/SecuritySection';
import { NotificationSection } from '../../components/settings/NotificationSection';
import { SubscriptionSection } from '../../components/settings/SubscriptionSection';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your profile, security, subscription, and notifications</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          <SubscriptionSection />
          <ProfileSection />
          <SecuritySection />
          <NotificationSection />
        </div>
      </div>
    </div>
  );
};

export default Settings;