import React from 'react';
import { X, Bluetooth, Activity, Heart, Wind, Settings, Volume2 } from 'lucide-react';
interface HelpSectionProps {
  onClose: () => void;
}
export const HelpSection = ({
  onClose
}: HelpSectionProps) => {
  return <div className="bg-white rounded-lg shadow-md p-5 mb-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close help">
        <X size={20} />
      </button>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Welcome to RespiraMate Dashboard
      </h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <Bluetooth className="text-blue-500 mr-2" size={18} />
            Getting Started
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Ensure your RespiraMate devices are charged and powered on</li>
            <li>Click the "Connect Device" button in the top right corner</li>
            <li>
              Follow the pairing instructions on your inhaler and wearable
            </li>
            <li>Once connected, you'll see real-time data on your dashboard</li>
          </ol>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <Activity className="text-blue-500 mr-2" size={18} />
            Understanding Your Data
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>
              <strong>Heart Rate:</strong> Shows your current heart rate in
              beats per minute (BPM)
            </li>
            <li>
              <strong>Air Quality:</strong> Displays ambient air quality
              percentage (higher is better)
            </li>
            <li>
              <strong>Inhaler Usage:</strong> Tracks how many times you've used
              your inhaler today
            </li>
            <li>
              <strong>Logs/History:</strong> View your data history for the past
              24 hours
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <Heart className="text-red-500 mr-2" size={18} />
            Alert System
          </h3>
          <p className="text-gray-600 mb-2">
            The alert panel will notify you of important events:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>
              <span className="text-green-600 font-medium">Green:</span> All
              metrics are normal
            </li>
            <li>
              <span className="text-amber-600 font-medium">Yellow:</span> Device
              disconnected or minor issues
            </li>
            <li>
              <span className="text-red-600 font-medium">Red:</span> Critical
              alerts requiring attention
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <Settings className="text-blue-500 mr-2" size={18} />
            Customizing Your Dashboard
          </h3>
          <p className="text-gray-600">
            Click "Show Device Settings" to customize alert thresholds,
            notification preferences, and display options. You can export your
            data logs as CSV files for sharing with healthcare providers.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
            <Volume2 className="text-blue-500 mr-2" size={18} />
            Voice Announcements
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>
              <strong>Connection Confirmation:</strong> The system will announce "Respira here, Active" 10 seconds after connecting your device
            </li>
            <li>
              <strong>Emergency Alerts:</strong> Voice announcements accompany critical alerts and fall detection
            </li>
            <li>
              <strong>Testing:</strong> Use Device Settings to test voice announcements and ensure audio is working
            </li>
            <li>
              <strong>Browser Permissions:</strong> Allow audio permissions when prompted for voice features to work
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          For additional support, contact RespiraMate Customer Service at
          support@respiraMate.example.com
        </p>
      </div>
    </div>;
};