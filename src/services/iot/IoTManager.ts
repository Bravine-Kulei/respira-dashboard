/**
 * IoT Manager - Central hub for managing IoT device connections and data
 * Supports multiple connection types: Bluetooth, WiFi, Serial, WebSocket
 */

export interface DeviceData {
  heartRate?: number;
  airQuality?: number;
  inhalerUsage?: number;
  inhalerBattery?: number;
  wearableBattery?: number;
  timestamp: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'inhaler' | 'wearable' | 'sensor';
  connectionType: 'bluetooth' | 'wifi' | 'serial' | 'websocket';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastSeen?: number;
  batteryLevel?: number;
}

export type ConnectionCallback = (data: DeviceData) => void;
export type StatusCallback = (device: DeviceInfo) => void;

export class IoTManager {
  private devices: Map<string, DeviceInfo> = new Map();
  private dataCallbacks: Set<ConnectionCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private isScanning = false;

  // Bluetooth Web API support
  private bluetoothDevices: Map<string, BluetoothDevice> = new Map();
  
  // WebSocket connections for WiFi devices
  private websocketConnections: Map<string, WebSocket> = new Map();
  
  // Serial port connections (Web Serial API)
  private serialPorts: Map<string, SerialPort> = new Map();

  constructor() {
    this.initializeConnections();
  }

  /**
   * Initialize connection handlers
   */
  private initializeConnections() {
    // Check for Web Bluetooth support
    if ('bluetooth' in navigator) {
      console.log('Web Bluetooth API supported');
    }

    // Check for Web Serial support
    if ('serial' in navigator) {
      console.log('Web Serial API supported');
    }

    // Setup WebSocket reconnection logic
    this.setupWebSocketReconnection();
  }

  /**
   * Register callback for device data updates
   */
  onDataReceived(callback: ConnectionCallback): () => void {
    this.dataCallbacks.add(callback);
    return () => this.dataCallbacks.delete(callback);
  }

  /**
   * Register callback for device status updates
   */
  onStatusChanged(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * Emit data to all registered callbacks
   */
  private emitData(data: DeviceData) {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data callback:', error);
      }
    });
  }

  /**
   * Emit status updates to all registered callbacks
   */
  private emitStatusUpdate(device: DeviceInfo) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(device);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  /**
   * Scan for available devices
   */
  async scanForDevices(): Promise<DeviceInfo[]> {
    if (this.isScanning) {
      console.log('Already scanning for devices');
      return Array.from(this.devices.values());
    }

    this.isScanning = true;
    const foundDevices: DeviceInfo[] = [];

    try {
      // Scan for Bluetooth devices
      if ('bluetooth' in navigator) {
        const bluetoothDevices = await this.scanBluetoothDevices();
        foundDevices.push(...bluetoothDevices);
      }

      // Scan for Serial devices
      if ('serial' in navigator) {
        const serialDevices = await this.scanSerialDevices();
        foundDevices.push(...serialDevices);
      }

      // Try to connect to known WiFi devices
      const wifiDevices = await this.scanWiFiDevices();
      foundDevices.push(...wifiDevices);

    } catch (error) {
      console.error('Error scanning for devices:', error);
    } finally {
      this.isScanning = false;
    }

    return foundDevices;
  }

  /**
   * Connect to a specific device
   */
  async connectToDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      console.error(`Device ${deviceId} not found`);
      return false;
    }

    device.status = 'connecting';
    this.emitStatusUpdate(device);

    try {
      switch (device.connectionType) {
        case 'bluetooth':
          return await this.connectBluetooth(device);
        case 'wifi':
        case 'websocket':
          return await this.connectWebSocket(device);
        case 'serial':
          return await this.connectSerial(device);
        default:
          throw new Error(`Unsupported connection type: ${device.connectionType}`);
      }
    } catch (error) {
      console.error(`Failed to connect to device ${deviceId}:`, error);
      device.status = 'error';
      this.emitStatusUpdate(device);
      return false;
    }
  }

  /**
   * Disconnect from a device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    try {
      switch (device.connectionType) {
        case 'bluetooth':
          return await this.disconnectBluetooth(deviceId);
        case 'wifi':
        case 'websocket':
          return await this.disconnectWebSocket(deviceId);
        case 'serial':
          return await this.disconnectSerial(deviceId);
      }
    } catch (error) {
      console.error(`Error disconnecting device ${deviceId}:`, error);
    }

    device.status = 'disconnected';
    this.emitStatusUpdate(device);
    return true;
  }

  /**
   * Get all registered devices
   */
  getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get connected devices only
   */
  getConnectedDevices(): DeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.status === 'connected');
  }

  /**
   * Send command to a device
   */
  async sendCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || device.status !== 'connected') {
      return false;
    }

    try {
      switch (device.connectionType) {
        case 'bluetooth':
          return await this.sendBluetoothCommand(deviceId, command, data);
        case 'wifi':
        case 'websocket':
          return await this.sendWebSocketCommand(deviceId, command, data);
        case 'serial':
          return await this.sendSerialCommand(deviceId, command, data);
      }
    } catch (error) {
      console.error(`Error sending command to device ${deviceId}:`, error);
      return false;
    }

    return false;
  }

  // Bluetooth-specific methods
  private async scanBluetoothDevices(): Promise<DeviceInfo[]> {
    // Implementation for Bluetooth device scanning
    // This will be implemented in the next file
    return [];
  }

  private async connectBluetooth(device: DeviceInfo): Promise<boolean> {
    // Implementation for Bluetooth connection
    return false;
  }

  private async disconnectBluetooth(deviceId: string): Promise<boolean> {
    // Implementation for Bluetooth disconnection
    return false;
  }

  private async sendBluetoothCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    // Implementation for Bluetooth command sending
    return false;
  }

  // WebSocket-specific methods
  private async scanWiFiDevices(): Promise<DeviceInfo[]> {
    // Implementation for WiFi device discovery
    return [];
  }

  private async connectWebSocket(device: DeviceInfo): Promise<boolean> {
    // Implementation for WebSocket connection
    return false;
  }

  private async disconnectWebSocket(deviceId: string): Promise<boolean> {
    // Implementation for WebSocket disconnection
    return false;
  }

  private async sendWebSocketCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    // Implementation for WebSocket command sending
    return false;
  }

  private setupWebSocketReconnection() {
    // Implementation for WebSocket reconnection logic
  }

  // Serial-specific methods
  private async scanSerialDevices(): Promise<DeviceInfo[]> {
    // Implementation for Serial device scanning
    return [];
  }

  private async connectSerial(device: DeviceInfo): Promise<boolean> {
    // Implementation for Serial connection
    return false;
  }

  private async disconnectSerial(deviceId: string): Promise<boolean> {
    // Implementation for Serial disconnection
    return false;
  }

  private async sendSerialCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    // Implementation for Serial command sending
    return false;
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.devices.keys()).map(deviceId => 
      this.disconnectDevice(deviceId)
    );
    
    await Promise.all(disconnectPromises);
    
    this.devices.clear();
    this.dataCallbacks.clear();
    this.statusCallbacks.clear();
  }
}

// Singleton instance
export const iotManager = new IoTManager();
