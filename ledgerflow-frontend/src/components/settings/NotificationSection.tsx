import React, { useState, useEffect } from 'react';
import { Bell, Save } from 'lucide-react';
import settingsService from '../../services/settings.service';
import { useToast } from '../ui';

interface NotificationSettings {
  emailNotifications: boolean;
  approvalAlerts: boolean;
  securityAlerts: boolean;
}

export const NotificationSection: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    approvalAlerts: true,
    securityAlerts: true
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const preferences = await settingsService.getPreferences();
      setNotifications({
        emailNotifications: preferences.emailNotifications ?? true,
        approvalAlerts: preferences.approvalAlerts ?? true,
        securityAlerts: preferences.securityAlerts ?? true
      });
    } catch (error: any) {
      toast.error('Failed to load notification settings', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Get current preferences and update only notification fields
      const currentPreferences = await settingsService.getPreferences();
      await settingsService.updatePreferences({
        ...currentPreferences,
        ...notifications
      });
      toast.success('Notification settings saved successfully');
    } catch (error: any) {
      toast.error('Failed to save notification settings', error.message);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (value: boolean) => void }> = ({ enabled, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-cyan-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5 text-cyan-400" />
        Notification Settings
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-white">Email Notifications</p>
            <p className="text-xs text-gray-400">Receive email updates about system activities</p>
          </div>
          <ToggleSwitch
            enabled={notifications.emailNotifications}
            onChange={(value) => setNotifications({ ...notifications, emailNotifications: value })}
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-white">Approval Alerts</p>
            <p className="text-xs text-gray-400">Get notified when approvals are needed</p>
          </div>
          <ToggleSwitch
            enabled={notifications.approvalAlerts}
            onChange={(value) => setNotifications({ ...notifications, approvalAlerts: value })}
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-white">Security Alerts</p>
            <p className="text-xs text-gray-400">Important security notifications</p>
          </div>
          <ToggleSwitch
            enabled={notifications.securityAlerts}
            onChange={(value) => setNotifications({ ...notifications, securityAlerts: value })}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
