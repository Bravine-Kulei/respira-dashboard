/**
 * Bluetooth Service - Handles Web Bluetooth API connections
 * Supports RespiraMate inhaler and wearable devices
 */

import { DeviceData, DeviceInfo } from './IoTManager';

export interface BluetoothServiceConfig {
  inhalerServiceUUID: string;
  wearableServiceUUID: string;
  dataCharacteristicUUID: string;
  batteryCharacteristicUUID: string;
  commandCharacteristicUUID: string;
}

export class BluetoothService {
  private config: BluetoothServiceConfig;
  private connectedDevices: Map<string, BluetoothDevice> = new Map();
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();

  constructor(config?: Partial<BluetoothServiceConfig>) {
    this.config = {
      // Standard UUIDs for RespiraMate devices
      inhalerServiceUUID: '12345678-1234-1234-1234-123456789abc',
      wearableServiceUUID: '87654321-4321-4321-4321-cba987654321',
      dataCharacteristicUUID: '11111111-1111-1111-1111-111111111111',
      batteryCharacteristicUUID: '22222222-2222-2222-2222-222222222222',
      commandCharacteristicUUID: '33333333-3333-3333-3333-333333333333',
      ...config
    };
  }

  /**
   * Check if Web Bluetooth is supported
   */
  isSupported(): boolean {
    return 'bluetooth' in navigator && 'requestDevice' in navigator.bluetooth;
  }

  /**
   * Scan for RespiraMate devices
   */
  async scanForDevices(): Promise<DeviceInfo[]> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'RespiraMate' },
          { namePrefix: 'Inhaler' },
          { namePrefix: 'Wearable' },
          { services: [this.config.inhalerServiceUUID] },
          { services: [this.config.wearableServiceUUID] }
        ],
        optionalServices: [
          this.config.inhalerServiceUUID,
          this.config.wearableServiceUUID,
          'battery_service'
        ]
      });

      const deviceInfo: DeviceInfo = {
        id: device.id,
        name: device.name || 'Unknown Device',
        type: this.getDeviceType(device.name || ''),
        connectionType: 'bluetooth',
        status: 'disconnected'
      };

      return [deviceInfo];
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
      return [];
    }
  }

  /**
   * Connect to a Bluetooth device
   */
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get primary service
      const serviceUUID = this.getServiceUUID(device.name || '');
      const service = await server.getPrimaryService(serviceUUID);

      // Get characteristics
      const dataCharacteristic = await service.getCharacteristic(this.config.dataCharacteristicUUID);
      const batteryCharacteristic = await service.getCharacteristic(this.config.batteryCharacteristicUUID);
      const commandCharacteristic = await service.getCharacteristic(this.config.commandCharacteristicUUID);

      // Store characteristics
      this.characteristics.set(`${deviceId}_data`, dataCharacteristic);
      this.characteristics.set(`${deviceId}_battery`, batteryCharacteristic);
      this.characteristics.set(`${deviceId}_command`, commandCharacteristic);

      // Setup notifications for data updates
      await dataCharacteristic.startNotifications();
      dataCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleDataReceived(deviceId, event);
      });

      // Setup notifications for battery updates
      await batteryCharacteristic.startNotifications();
      batteryCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleBatteryUpdate(deviceId, event);
      });

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDeviceDisconnected(deviceId);
      });

      this.connectedDevices.set(deviceId, device);
      return true;

    } catch (error) {
      console.error(`Error connecting to device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from a Bluetooth device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (device && device.gatt?.connected) {
        device.gatt.disconnect();
      }

      // Clean up characteristics
      this.characteristics.delete(`${deviceId}_data`);
      this.characteristics.delete(`${deviceId}_battery`);
      this.characteristics.delete(`${deviceId}_command`);

      this.connectedDevices.delete(deviceId);
      return true;
    } catch (error) {
      console.error(`Error disconnecting device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Send command to device
   */
  async sendCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    try {
      const characteristic = this.characteristics.get(`${deviceId}_command`);
      if (!characteristic) {
        throw new Error(`Command characteristic not found for device ${deviceId}`);
      }

      const commandData = this.encodeCommand(command, data);
      await characteristic.writeValue(commandData);
      return true;
    } catch (error) {
      console.error(`Error sending command to device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Get device by ID from browser's Bluetooth cache
   */
  private async getDeviceById(deviceId: string): Promise<BluetoothDevice | null> {
    try {
      const devices = await navigator.bluetooth.getDevices();
      return devices.find(device => device.id === deviceId) || null;
    } catch (error) {
      console.error('Error getting device by ID:', error);
      return null;
    }
  }

  /**
   * Determine device type from name
   */
  private getDeviceType(deviceName: string): 'inhaler' | 'wearable' | 'sensor' {
    const name = deviceName.toLowerCase();
    if (name.includes('inhaler')) return 'inhaler';
    if (name.includes('wearable') || name.includes('watch')) return 'wearable';
    return 'sensor';
  }

  /**
   * Get service UUID based on device name
   */
  private getServiceUUID(deviceName: string): string {
    const deviceType = this.getDeviceType(deviceName);
    return deviceType === 'inhaler' 
      ? this.config.inhalerServiceUUID 
      : this.config.wearableServiceUUID;
  }

  /**
   * Handle incoming data from device
   */
  private handleDataReceived(deviceId: string, event: Event): void {
    try {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const value = characteristic.value;
      
      if (!value) return;

      const data = this.parseDeviceData(value);
      
      // Emit data through IoT Manager
      const deviceData: DeviceData = {
        ...data,
        timestamp: Date.now()
      };

      // This would be called through the IoT Manager
      console.log('Received data from device:', deviceId, deviceData);
    } catch (error) {
      console.error('Error handling received data:', error);
    }
  }

  /**
   * Handle battery level updates
   */
  private handleBatteryUpdate(deviceId: string, event: Event): void {
    try {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const value = characteristic.value;
      
      if (!value) return;

      const batteryLevel = value.getUint8(0);
      console.log(`Device ${deviceId} battery level: ${batteryLevel}%`);
    } catch (error) {
      console.error('Error handling battery update:', error);
    }
  }

  /**
   * Handle device disconnection
   */
  private handleDeviceDisconnected(deviceId: string): void {
    console.log(`Device ${deviceId} disconnected`);
    this.connectedDevices.delete(deviceId);
    
    // Clean up characteristics
    this.characteristics.delete(`${deviceId}_data`);
    this.characteristics.delete(`${deviceId}_battery`);
    this.characteristics.delete(`${deviceId}_command`);
  }

  /**
   * Parse raw device data
   */
  private parseDeviceData(value: DataView): Partial<DeviceData> {
    // Protocol: [type][data_length][data...]
    // Type: 0x01 = heart rate, 0x02 = air quality, 0x03 = inhaler usage
    
    const data: Partial<DeviceData> = {};
    let offset = 0;

    while (offset < value.byteLength) {
      const type = value.getUint8(offset);
      const length = value.getUint8(offset + 1);
      offset += 2;

      switch (type) {
        case 0x01: // Heart rate
          data.heartRate = value.getUint16(offset, true);
          break;
        case 0x02: // Air quality
          data.airQuality = value.getUint16(offset, true);
          break;
        case 0x03: // Inhaler usage
          data.inhalerUsage = value.getUint16(offset, true);
          break;
        case 0x04: // Battery level
          data.inhalerBattery = value.getUint8(offset);
          break;
      }

      offset += length;
    }

    return data;
  }

  /**
   * Encode command for transmission
   */
  private encodeCommand(command: string, data?: any): ArrayBuffer {
    const encoder = new TextEncoder();
    const commandBytes = encoder.encode(command);
    
    if (!data) {
      return commandBytes.buffer;
    }

    // Simple JSON encoding for complex data
    const dataBytes = encoder.encode(JSON.stringify(data));
    const buffer = new ArrayBuffer(commandBytes.length + dataBytes.length + 1);
    const view = new Uint8Array(buffer);
    
    view.set(commandBytes, 0);
    view[commandBytes.length] = 0; // Null separator
    view.set(dataBytes, commandBytes.length + 1);
    
    return buffer;
  }

  /**
   * Get connection status of all devices
   */
  getConnectionStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    
    this.connectedDevices.forEach((device, deviceId) => {
      status.set(deviceId, device.gatt?.connected || false);
    });
    
    return status;
  }
}
