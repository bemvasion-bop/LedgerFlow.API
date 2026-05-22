import React from 'react';
import { ProfileSection } from '../../components/settings/ProfileSection';
import { SecuritySection } from '../../components/settings/SecuritySection';
import { PreferencesSection } from '../../components/settings/PreferencesSection';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header - Simple module header without profile/notification */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your profile, security, and platform preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <ProfileSection />
        <SecuritySection />
        <PreferencesSection />
      </div>
    </div>
  );
};

export default Settings;
