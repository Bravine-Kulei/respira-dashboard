/**
 * IoT Device Manager Component
 * Provides UI for discovering, connecting, and managing IoT devices
 */

import React, { useState } from 'react';
import { 
  Bluetooth, 
  Wifi, 
  Usb, 
  Search, 
  Power, 
  PowerOff, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { useDeviceManager } from '../hooks/useIoTConnection';
import { DeviceInfo } from '../services/iot/IoTManager';

interface IoTDeviceManagerProps {
  onDeviceConnected?: (device: DeviceInfo) => void;
  onDeviceDisconnected?: (device: DeviceInfo) => void;
  className?: string;
}

export const IoTDeviceManager: React.FC<IoTDeviceManagerProps> = ({
  onDeviceConnected,
  onDeviceDisconnected,
  className = ''
}) => {
  const {
    devices,
    connectedDevices,
    isScanning,
    isConnecting,
    error,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    clearError
  } = useDeviceManager();

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  /**
   * Handle device connection
   */
  const handleConnect = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    const success = await connectToDevice(deviceId);
    
    if (success) {
      const device = devices.find(d => d.id === deviceId);
      if (device && onDeviceConnected) {
        onDeviceConnected(device);
      }
    }
    
    setSelectedDevice(null);
  };

  /**
   * Handle device disconnection
   */
  const handleDisconnect = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    const success = await disconnectDevice(deviceId);
    
    if (success) {
      const device = devices.find(d => d.id === deviceId);
      if (device && onDeviceDisconnected) {
        onDeviceDisconnected(device);
      }
    }
    
    setSelectedDevice(null);
  };

  /**
   * Get connection type icon
   */
  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case 'bluetooth':
        return <Bluetooth size={16} className="text-blue-500" />;
      case 'wifi':
      case 'websocket':
        return <Wifi size={16} className="text-green-500" />;
      case 'serial':
        return <Usb size={16} className="text-purple-500" />;
      default:
        return <Settings size={16} className="text-gray-500" />;
    }
  };

  /**
   * Get status indicator
   */
  const getStatusIndicator = (device: DeviceInfo) => {
    const isConnected = connectedDevices.some(d => d.id === device.id);
    const isProcessing = selectedDevice === device.id && (isConnecting || isScanning);

    if (isProcessing) {
      return <Loader2 size={16} className="text-blue-500 animate-spin" />;
    }

    if (isConnected) {
      return <CheckCircle size={16} className="text-green-500" />;
    }

    switch (device.status) {
      case 'connecting':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  /**
   * Get device type badge color
   */
  const getDeviceTypeBadge = (type: string) => {
    const colors = {
      inhaler: 'bg-blue-100 text-blue-800',
      wearable: 'bg-green-100 text-green-800',
      sensor: 'bg-purple-100 text-purple-800'
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">IoT Device Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your RespiraMate devices and sensors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddDevice(!showAddDevice)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Device
          </button>
          
          <button
            onClick={scanForDevices}
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isScanning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Connected Devices</h3>
          <div className="space-y-2">
            {connectedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
              >
                <div className="flex items-center gap-3">
                  {getConnectionIcon(device.connectionType)}
                  <div>
                    <div className="font-medium text-gray-800">{device.name}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs ${getDeviceTypeBadge(device.type)}`}>
                        {device.type}
                      </span>
                      <span>{device.connectionType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIndicator(device)}
                  <button
                    onClick={() => handleDisconnect(device.id)}
                    disabled={selectedDevice === device.id}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <PowerOff size={14} />
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Devices */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">Available Devices</h3>
        
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No devices found</p>
            <p className="text-sm">Click "Scan" to search for devices</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices
              .filter(device => !connectedDevices.some(cd => cd.id === device.id))
              .map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getConnectionIcon(device.connectionType)}
                    <div>
                      <div className="font-medium text-gray-800">{device.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDeviceTypeBadge(device.type)}`}>
                          {device.type}
                        </span>
                        <span>{device.connectionType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIndicator(device)}
                    <button
                      onClick={() => handleConnect(device.id)}
                      disabled={selectedDevice === device.id || device.status === 'connecting'}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Power size={14} />
                      Connect
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Device Panel */}
      {showAddDevice && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-800 mb-3">Add New Device</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button className="flex items-center gap-2 p-3 border border-gray-300 rounded-md hover:bg-white transition-colors">
              <Bluetooth size={20} className="text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Bluetooth Device</div>
                <div className="text-sm text-gray-600">Pair via Bluetooth</div>
              </div>
            </button>
            
            <button className="flex items-center gap-2 p-3 border border-gray-300 rounded-md hover:bg-white transition-colors">
              <Wifi size={20} className="text-green-500" />
              <div className="text-left">
                <div className="font-medium">WiFi Device</div>
                <div className="text-sm text-gray-600">Connect via WiFi</div>
              </div>
            </button>
            
            <button className="flex items-center gap-2 p-3 border border-gray-300 rounded-md hover:bg-white transition-colors">
              <Usb size={20} className="text-purple-500" />
              <div className="text-left">
                <div className="font-medium">USB/Serial Device</div>
                <div className="text-sm text-gray-600">Connect via USB</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Connection Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{connectedDevices.length}</div>
            <div className="text-sm text-gray-600">Connected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {devices.filter(d => d.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
};
