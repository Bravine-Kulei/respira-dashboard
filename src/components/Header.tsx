import React from 'react';
import { Bluetooth, BluetoothOff, HelpCircle } from 'lucide-react';
interface HeaderProps {
  onConnect: () => void;
  isConnected: boolean;
  lastSyncTime: string | null;
  onHelpToggle: () => void;
  connectionQuality?: 'excellent' | 'good' | 'poor';
}
export const Header = ({
  onConnect,
  isConnected,
  lastSyncTime,
  onHelpToggle,
  connectionQuality = 'excellent'
}: HeaderProps) => {
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-blue-600 font-bold text-2xl">
            <span className="text-blue-800">Respira</span>Mate
          </div>
          <span className="text-sm text-gray-600">Dashboard</span>
          {isConnected && (
            <div className="flex items-center ml-4">
              <div className={`w-2 h-2 rounded-full ${connectionQuality === 'excellent' ? 'bg-green-500' : connectionQuality === 'good' ? 'bg-yellow-500' : 'bg-red-500'} mr-1`}></div>
              <span className={`text-xs ${getConnectionQualityColor()}`}>
                {connectionQuality}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onHelpToggle} className="text-gray-500 hover:text-blue-600" aria-label="Help">
            <HelpCircle size={20} />
          </button>
          <button onClick={onConnect} className={`flex items-center gap-2 px-4 py-2 rounded-md text-white ${isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {isConnected ? <>
                <Bluetooth size={18} />
                <span>Disconnect</span>
              </> : <>
                <BluetoothOff size={18} />
                <span>Connect Device</span>
              </>}
          </button>
        </div>
      </div>
    </header>;
};