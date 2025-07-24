/**
 * IoT Integration Example
 * Demonstrates how to integrate the new IoT system with the existing dashboard
 */

import React, { useState, useEffect } from 'react';
import { useIoTConnection } from '../src/hooks/useIoTConnection';
import { IoTDeviceManager } from '../src/components/IoTDeviceManager';
import { IoTDataDisplay } from '../src/components/IoTDataDisplay';
import { iotManager } from '../src/services/iot/IoTManager';

// Example: Enhanced App component with IoT integration
export function EnhancedApp() {
  const [showIoTManager, setShowIoTManager] = useState(false);
  const [useRealDevices, setUseRealDevices] = useState(false);
  
  // Use the IoT connection hook
  const [iotState, iotActions] = useIoTConnection({
    autoScan: true,
    autoReconnect: true,
    scanInterval: 30000
  });

  // State for dashboard data (can come from IoT or simulation)
  const [dashboardData, setDashboardData] = useState({
    heartRate: null,
    airQuality: null,
    usageCount: null,
    inhalerBattery: null,
    wearableBattery: null,
    connectionStatus: 'Disconnected'
  });

  // Update dashboard data when IoT data is received
  useEffect(() => {
    if (useRealDevices && iotState.lastData) {
      setDashboardData({
        heartRate: iotState.lastData.heartRate || null,
        airQuality: iotState.lastData.airQuality || null,
        usageCount: iotState.lastData.inhalerUsage || null,
        inhalerBattery: iotState.lastData.inhalerBattery || null,
        wearableBattery: iotState.lastData.wearableBattery || null,
        connectionStatus: iotState.connectedDevices.length > 0 ? 'Connected' : 'Disconnected'
      });
    }
  }, [iotState.lastData, iotState.connectedDevices, useRealDevices]);

  // Handle device connection
  const handleDeviceConnected = (device) => {
    console.log('Device connected:', device);
    setUseRealDevices(true);
  };

  // Handle device disconnection
  const handleDeviceDisconnected = (device) => {
    console.log('Device disconnected:', device);
    if (iotState.connectedDevices.length === 0) {
      setUseRealDevices(false);
    }
  };

  // Toggle between real devices and simulation
  const toggleDataSource = () => {
    if (useRealDevices && iotState.connectedDevices.length > 0) {
      // Disconnect all devices
      iotState.connectedDevices.forEach(device => {
        iotActions.disconnectDevice(device.id);
      });
      setUseRealDevices(false);
    } else {
      // Show IoT manager to connect devices
      setShowIoTManager(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with IoT Controls */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-blue-600 font-bold text-2xl">
              <span className="text-blue-800">Respira</span>Mate
            </div>
            <span className="text-sm text-gray-600">Dashboard</span>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                iotState.connectionQuality === 'excellent' ? 'bg-green-500' :
                iotState.connectionQuality === 'good' ? 'bg-yellow-500' :
                iotState.connectionQuality === 'poor' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
              <span className="text-sm text-gray-600">
                {useRealDevices ? `IoT (${iotState.connectionQuality})` : 'Simulation'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Data Source Toggle */}
            <button
              onClick={toggleDataSource}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                useRealDevices 
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {useRealDevices ? 'Using Real Devices' : 'Use Real Devices'}
            </button>
            
            {/* IoT Manager Toggle */}
            <button
              onClick={() => setShowIoTManager(!showIoTManager)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              {showIoTManager ? 'Hide' : 'Show'} Device Manager
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* IoT Device Manager */}
        {showIoTManager && (
          <div className="mb-6">
            <IoTDeviceManager
              onDeviceConnected={handleDeviceConnected}
              onDeviceDisconnected={handleDeviceDisconnected}
            />
          </div>
        )}

        {/* Real-time IoT Data Display */}
        {useRealDevices && iotState.connectedDevices.length > 0 && (
          <div className="mb-6">
            <IoTDataDisplay
              showCharts={true}
              refreshInterval={1000}
            />
          </div>
        )}

        {/* Error Display */}
        {iotState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-red-700">{iotState.error}</span>
              <button
                onClick={iotActions.clearError}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Device Status Summary */}
        {iotState.devices.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Device Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {iotState.devices.length}
                </div>
                <div className="text-sm text-gray-600">Available Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {iotState.connectedDevices.length}
                </div>
                <div className="text-sm text-gray-600">Connected Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {iotState.lastData ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Data Streaming</div>
              </div>
            </div>
          </div>
        )}

        {/* Your existing dashboard components would go here */}
        {/* They can now use either real IoT data or simulated data */}
        
        {/* Example: Data cards that work with both sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DataCard
            title="Heart Rate"
            value={dashboardData.heartRate ? `${Math.round(dashboardData.heartRate)} BPM` : 'N/A'}
            source={useRealDevices ? 'IoT Device' : 'Simulation'}
          />
          <DataCard
            title="Air Quality"
            value={dashboardData.airQuality ? `${Math.round(dashboardData.airQuality)}%` : 'N/A'}
            source={useRealDevices ? 'IoT Device' : 'Simulation'}
          />
          <DataCard
            title="Inhaler Usage"
            value={dashboardData.usageCount ? `${dashboardData.usageCount} today` : 'N/A'}
            source={useRealDevices ? 'IoT Device' : 'Simulation'}
          />
          <DataCard
            title="Connection"
            value={dashboardData.connectionStatus}
            source={useRealDevices ? 'IoT Device' : 'Simulation'}
          />
        </div>

        {/* Instructions for first-time users */}
        {iotState.devices.length === 0 && !iotState.isScanning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Ready to Connect Your Devices?
            </h3>
            <p className="text-blue-700 mb-4">
              Click "Show Device Manager" to discover and connect your RespiraMate devices.
            </p>
            <div className="text-sm text-blue-600">
              <p>Supported: Bluetooth, WiFi, and USB/Serial devices</p>
              <p>Requires HTTPS for Bluetooth and Serial connections</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper component for data cards
const DataCard = ({ title, value, source }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <span className="text-xs text-gray-500">{source}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

// Example: Custom hook for device-specific logic
export function useDeviceSpecificLogic() {
  const [iotState] = useIoTConnection();
  
  // Custom logic based on connected device types
  const inhalerDevices = iotState.connectedDevices.filter(d => d.type === 'inhaler');
  const wearableDevices = iotState.connectedDevices.filter(d => d.type === 'wearable');
  
  // Device-specific data processing
  const processedData = React.useMemo(() => {
    if (!iotState.lastData) return null;
    
    return {
      ...iotState.lastData,
      // Add device-specific processing
      heartRateZone: getHeartRateZone(iotState.lastData.heartRate),
      airQualityLevel: getAirQualityLevel(iotState.lastData.airQuality),
      batteryStatus: getBatteryStatus(iotState.lastData.inhalerBattery)
    };
  }, [iotState.lastData]);
  
  return {
    inhalerDevices,
    wearableDevices,
    processedData,
    hasDevices: iotState.connectedDevices.length > 0
  };
}

// Helper functions
function getHeartRateZone(heartRate) {
  if (!heartRate) return 'unknown';
  if (heartRate < 60) return 'low';
  if (heartRate < 100) return 'normal';
  if (heartRate < 150) return 'elevated';
  return 'high';
}

function getAirQualityLevel(airQuality) {
  if (!airQuality) return 'unknown';
  if (airQuality >= 80) return 'good';
  if (airQuality >= 60) return 'moderate';
  if (airQuality >= 40) return 'poor';
  return 'very poor';
}

function getBatteryStatus(battery) {
  if (!battery) return 'unknown';
  if (battery >= 60) return 'good';
  if (battery >= 30) return 'low';
  return 'critical';
}

export default EnhancedApp;
