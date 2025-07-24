/**
 * React Hook for IoT Device Connection Management
 * Provides easy integration with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { iotManager, DeviceData, DeviceInfo } from '../services/iot/IoTManager';

export interface IoTConnectionState {
  devices: DeviceInfo[];
  connectedDevices: DeviceInfo[];
  isScanning: boolean;
  isConnecting: boolean;
  lastData: DeviceData | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  error: string | null;
}

export interface IoTConnectionActions {
  scanForDevices: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<boolean>;
  disconnectDevice: (deviceId: string) => Promise<boolean>;
  sendCommand: (deviceId: string, command: string, data?: any) => Promise<boolean>;
  clearError: () => void;
}

export interface UseIoTConnectionOptions {
  autoScan?: boolean;
  autoReconnect?: boolean;
  scanInterval?: number;
  dataRetentionTime?: number;
}

export function useIoTConnection(options: UseIoTConnectionOptions = {}): [IoTConnectionState, IoTConnectionActions] {
  const {
    autoScan = false,
    autoReconnect = true,
    scanInterval = 30000, // 30 seconds
    dataRetentionTime = 300000 // 5 minutes
  } = options;

  // State
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastData, setLastData] = useState<DeviceData | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update connection quality based on connected devices and data freshness
   */
  const updateConnectionQuality = useCallback(() => {
    const connected = connectedDevices.length;
    const now = Date.now();
    const dataAge = lastData ? now - lastData.timestamp : Infinity;

    if (connected === 0) {
      setConnectionQuality('disconnected');
    } else if (dataAge < 5000) { // Data within 5 seconds
      setConnectionQuality('excellent');
    } else if (dataAge < 15000) { // Data within 15 seconds
      setConnectionQuality('good');
    } else {
      setConnectionQuality('poor');
    }
  }, [connectedDevices.length, lastData]);

  /**
   * Scan for available devices
   */
  const scanForDevices = useCallback(async () => {
    if (isScanning) return;

    setIsScanning(true);
    setError(null);

    try {
      const foundDevices = await iotManager.scanForDevices();
      setDevices(foundDevices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan for devices';
      setError(errorMessage);
      console.error('Error scanning for devices:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  /**
   * Connect to a specific device
   */
  const connectToDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const success = await iotManager.connectToDevice(deviceId);
      
      if (success) {
        // Update device status
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { ...device, status: 'connected' }
            : device
        ));
        
        // Update connected devices list
        const device = devices.find(d => d.id === deviceId);
        if (device) {
          setConnectedDevices(prev => [...prev, { ...device, status: 'connected' }]);
        }
      } else {
        setError(`Failed to connect to device ${deviceId}`);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      console.error('Error connecting to device:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [devices]);

  /**
   * Disconnect from a specific device
   */
  const disconnectDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    setError(null);

    try {
      const success = await iotManager.disconnectDevice(deviceId);
      
      if (success) {
        // Update device status
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { ...device, status: 'disconnected' }
            : device
        ));
        
        // Remove from connected devices
        setConnectedDevices(prev => prev.filter(device => device.id !== deviceId));
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnection failed';
      setError(errorMessage);
      console.error('Error disconnecting device:', err);
      return false;
    }
  }, []);

  /**
   * Send command to a device
   */
  const sendCommand = useCallback(async (deviceId: string, command: string, data?: any): Promise<boolean> => {
    setError(null);

    try {
      const success = await iotManager.sendCommand(deviceId, command, data);
      
      if (!success) {
        setError(`Failed to send command to device ${deviceId}`);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command failed';
      setError(errorMessage);
      console.error('Error sending command:', err);
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle incoming device data
   */
  const handleDataReceived = useCallback((data: DeviceData) => {
    setLastData(data);
    
    // Clear existing timeout
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }
    
    // Set timeout to clear old data
    dataTimeoutRef.current = setTimeout(() => {
      setLastData(null);
    }, dataRetentionTime);
  }, [dataRetentionTime]);

  /**
   * Handle device status changes
   */
  const handleStatusChanged = useCallback((device: DeviceInfo) => {
    // Update devices list
    setDevices(prev => prev.map(d => 
      d.id === device.id ? device : d
    ));

    // Update connected devices list
    if (device.status === 'connected') {
      setConnectedDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        if (!exists) {
          return [...prev, device];
        }
        return prev.map(d => d.id === device.id ? device : d);
      });
    } else {
      setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
    }

    // Handle auto-reconnection
    if (autoReconnect && device.status === 'disconnected') {
      reconnectTimeoutRef.current = setTimeout(() => {
        connectToDevice(device.id);
      }, 5000); // Retry after 5 seconds
    }
  }, [autoReconnect, connectToDevice]);

  /**
   * Setup IoT Manager event listeners
   */
  useEffect(() => {
    const unsubscribeData = iotManager.onDataReceived(handleDataReceived);
    const unsubscribeStatus = iotManager.onStatusChanged(handleStatusChanged);

    return () => {
      unsubscribeData();
      unsubscribeStatus();
    };
  }, [handleDataReceived, handleStatusChanged]);

  /**
   * Setup auto-scanning
   */
  useEffect(() => {
    if (autoScan) {
      // Initial scan
      scanForDevices();
      
      // Setup interval scanning
      scanIntervalRef.current = setInterval(scanForDevices, scanInterval);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [autoScan, scanInterval, scanForDevices]);

  /**
   * Update connection quality when dependencies change
   */
  useEffect(() => {
    updateConnectionQuality();
  }, [updateConnectionQuality]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // State object
  const state: IoTConnectionState = {
    devices,
    connectedDevices,
    isScanning,
    isConnecting,
    lastData,
    connectionQuality,
    error
  };

  // Actions object
  const actions: IoTConnectionActions = {
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    sendCommand,
    clearError
  };

  return [state, actions];
}

/**
 * Hook for simplified device data access
 */
export function useDeviceData(deviceId?: string) {
  const [state] = useIoTConnection();
  
  const deviceData = state.lastData;
  const isConnected = state.connectedDevices.some(device => 
    deviceId ? device.id === deviceId : true
  );
  
  return {
    data: deviceData,
    isConnected,
    connectionQuality: state.connectionQuality,
    timestamp: deviceData?.timestamp
  };
}

/**
 * Hook for device management
 */
export function useDeviceManager() {
  const [state, actions] = useIoTConnection({ autoScan: true });
  
  return {
    devices: state.devices,
    connectedDevices: state.connectedDevices,
    isScanning: state.isScanning,
    isConnecting: state.isConnecting,
    error: state.error,
    ...actions
  };
}
