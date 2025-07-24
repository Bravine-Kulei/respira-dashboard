import React, { useState } from 'react';
import { Settings, Save, Moon, Sun, Smartphone } from 'lucide-react';
interface DeviceSettingsProps {
  initialSettings: {
    heartRateThreshold: number;
    airQualityThreshold: number;
    notificationsEnabled: boolean;
  };
  onSettingsChange: (settings: any) => void;
}
export const DeviceSettings = ({
  initialSettings,
  onSettingsChange
}: DeviceSettingsProps) => {
  const [settings, setSettings] = useState({
    ...initialSettings,
    darkMode: false,
    vibrationAlerts: true,
    soundAlerts: false,
    autoSync: true
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    const newSettings = {
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    };
    setSettings(newSettings);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update parent component with threshold settings
    onSettingsChange({
      heartRateThreshold: Number(settings.heartRateThreshold),
      airQualityThreshold: Number(settings.airQualityThreshold),
      notificationsEnabled: settings.notificationsEnabled
    });
    // In a real app, this would save settings to the device
    console.log('Settings saved:', settings);
  };
  return <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center mb-4">
        <Settings size={20} className="text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">Device Settings</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="heartRateThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Heart Rate Alert Threshold (BPM)
            </label>
            <input type="number" id="heartRateThreshold" name="heartRateThreshold" value={settings.heartRateThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="airQualityThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Air Quality Alert Threshold (%)
            </label>
            <input type="number" id="airQualityThreshold" name="airQualityThreshold" value={settings.airQualityThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Notification Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <input type="checkbox" id="notificationsEnabled" name="notificationsEnabled" checked={settings.notificationsEnabled} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="notificationsEnabled" className="ml-2 block text-sm text-gray-700">
                Enable Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="vibrationAlerts" name="vibrationAlerts" checked={settings.vibrationAlerts} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="vibrationAlerts" className="ml-2 block text-sm text-gray-700">
                Vibration Alerts
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="soundAlerts" name="soundAlerts" checked={settings.soundAlerts} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="soundAlerts" className="ml-2 block text-sm text-gray-700">
                Sound Alerts
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="autoSync" name="autoSync" checked={settings.autoSync} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="autoSync" className="ml-2 block text-sm text-gray-700">
                Auto-sync Data
              </label>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Display Settings
          </h3>
          <div className="flex items-center">
            <button type="button" className={`flex items-center px-3 py-1.5 rounded-l-md ${!settings.darkMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`} onClick={() => setSettings({
            ...settings,
            darkMode: false
          })}>
              <Sun size={16} className="mr-1" />
              Light
            </button>
            <button type="button" className={`flex items-center px-3 py-1.5 rounded-r-md ${settings.darkMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`} onClick={() => setSettings({
            ...settings,
            darkMode: true
          })}>
              <Moon size={16} className="mr-1" />
              Dark
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Save size={16} className="mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </div>;
};