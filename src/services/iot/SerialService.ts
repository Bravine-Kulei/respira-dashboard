/**
 * Serial Service - Handles USB/Serial connected IoT devices
 * Uses Web Serial API for direct device communication
 */

import { DeviceData, DeviceInfo } from './IoTManager';

export interface SerialDeviceConfig {
  vendorId?: number;
  productId?: number;
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  flowControl?: 'none' | 'hardware';
  deviceType: 'inhaler' | 'wearable' | 'sensor';
}

export interface SerialServiceConfig {
  defaultBaudRate: number;
  readTimeout: number;
  writeTimeout: number;
  bufferSize: number;
}

export class SerialService {
  private config: SerialServiceConfig;
  private connectedPorts: Map<string, SerialPort> = new Map();
  private readers: Map<string, ReadableStreamDefaultReader> = new Map();
  private writers: Map<string, WritableStreamDefaultWriter> = new Map();
  private deviceConfigs: Map<string, SerialDeviceConfig> = new Map();

  constructor(config?: Partial<SerialServiceConfig>) {
    this.config = {
      defaultBaudRate: 115200,
      readTimeout: 5000,
      writeTimeout: 3000,
      bufferSize: 1024,
      ...config
    };
  }

  /**
   * Check if Web Serial API is supported
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Request user to select a serial device
   */
  async requestDevice(filters?: SerialPortFilter[]): Promise<DeviceInfo | null> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      const port = await navigator.serial.requestPort({
        filters: filters || [
          { usbVendorId: 0x2341 }, // Arduino
          { usbVendorId: 0x10C4 }, // Silicon Labs
          { usbVendorId: 0x1A86 }, // QinHeng Electronics
          { usbVendorId: 0x0403 }, // FTDI
        ]
      });

      const info = port.getInfo();
      const deviceId = this.generateDeviceId(info);

      const deviceInfo: DeviceInfo = {
        id: deviceId,
        name: this.getDeviceName(info),
        type: 'sensor', // Default, can be updated based on device identification
        connectionType: 'serial',
        status: 'disconnected'
      };

      return deviceInfo;
    } catch (error) {
      console.error('Error requesting serial device:', error);
      return null;
    }
  }

  /**
   * Get list of available serial ports
   */
  async getAvailablePorts(): Promise<DeviceInfo[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const ports = await navigator.serial.getPorts();
      const devices: DeviceInfo[] = [];

      for (const port of ports) {
        const info = port.getInfo();
        const deviceId = this.generateDeviceId(info);

        devices.push({
          id: deviceId,
          name: this.getDeviceName(info),
          type: 'sensor',
          connectionType: 'serial',
          status: 'disconnected'
        });
      }

      return devices;
    } catch (error) {
      console.error('Error getting available ports:', error);
      return [];
    }
  }

  /**
   * Connect to a serial device
   */
  async connectToDevice(deviceId: string, config: SerialDeviceConfig): Promise<boolean> {
    try {
      const port = await this.getPortById(deviceId);
      if (!port) {
        throw new Error(`Serial port for device ${deviceId} not found`);
      }

      // Open the port with specified configuration
      await port.open({
        baudRate: config.baudRate || this.config.defaultBaudRate,
        dataBits: config.dataBits || 8,
        stopBits: config.stopBits || 1,
        parity: config.parity || 'none',
        flowControl: config.flowControl || 'none'
      });

      // Setup readers and writers
      const reader = port.readable?.getReader();
      const writer = port.writable?.getWriter();

      if (!reader || !writer) {
        throw new Error('Failed to get port reader/writer');
      }

      this.connectedPorts.set(deviceId, port);
      this.readers.set(deviceId, reader);
      this.writers.set(deviceId, writer);
      this.deviceConfigs.set(deviceId, config);

      // Start reading data
      this.startReading(deviceId);

      console.log(`Connected to serial device: ${deviceId}`);
      return true;

    } catch (error) {
      console.error(`Error connecting to serial device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from a serial device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      // Stop reading
      const reader = this.readers.get(deviceId);
      if (reader) {
        await reader.cancel();
        reader.releaseLock();
        this.readers.delete(deviceId);
      }

      // Release writer
      const writer = this.writers.get(deviceId);
      if (writer) {
        await writer.close();
        this.writers.delete(deviceId);
      }

      // Close port
      const port = this.connectedPorts.get(deviceId);
      if (port) {
        await port.close();
        this.connectedPorts.delete(deviceId);
      }

      this.deviceConfigs.delete(deviceId);

      console.log(`Disconnected from serial device: ${deviceId}`);
      return true;

    } catch (error) {
      console.error(`Error disconnecting serial device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Send command to serial device
   */
  async sendCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    try {
      const writer = this.writers.get(deviceId);
      if (!writer) {
        throw new Error(`Writer not found for device ${deviceId}`);
      }

      // Format command (simple text protocol)
      let message = command;
      if (data) {
        message += ` ${JSON.stringify(data)}`;
      }
      message += '\n';

      const encoder = new TextEncoder();
      const commandBytes = encoder.encode(message);

      await writer.write(commandBytes);
      return true;

    } catch (error) {
      console.error(`Error sending command to serial device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Start reading data from device
   */
  private async startReading(deviceId: string): Promise<void> {
    const reader = this.readers.get(deviceId);
    if (!reader) return;

    try {
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode received data
        const decoder = new TextDecoder();
        const chunk = decoder.decode(value);
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            this.processReceivedData(deviceId, line.trim());
          }
        }
      }
    } catch (error) {
      if (error.name !== 'NetworkError') {
        console.error(`Error reading from serial device ${deviceId}:`, error);
      }
    }
  }

  /**
   * Process received data from device
   */
  private processReceivedData(deviceId: string, data: string): void {
    try {
      // Try to parse as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        // If not JSON, try to parse as simple key-value pairs
        parsedData = this.parseSimpleData(data);
      }

      const deviceData: DeviceData = {
        heartRate: parsedData.heartRate || parsedData.hr,
        airQuality: parsedData.airQuality || parsedData.aq,
        inhalerUsage: parsedData.inhalerUsage || parsedData.usage,
        inhalerBattery: parsedData.inhalerBattery || parsedData.battery,
        wearableBattery: parsedData.wearableBattery,
        timestamp: Date.now()
      };

      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(deviceData).filter(([_, value]) => value !== undefined)
      ) as DeviceData;

      if (Object.keys(filteredData).length > 1) { // More than just timestamp
        console.log('Received data from serial device:', deviceId, filteredData);
        // This would be emitted through the IoT Manager
      }

    } catch (error) {
      console.error(`Error processing data from device ${deviceId}:`, error);
    }
  }

  /**
   * Parse simple key-value data format
   */
  private parseSimpleData(data: string): any {
    const result: any = {};
    
    // Support formats like: "hr:75,aq:85,battery:90"
    const pairs = data.split(',');
    
    for (const pair of pairs) {
      const [key, value] = pair.split(':');
      if (key && value) {
        const numValue = parseFloat(value.trim());
        if (!isNaN(numValue)) {
          result[key.trim()] = numValue;
        } else {
          result[key.trim()] = value.trim();
        }
      }
    }

    return result;
  }

  /**
   * Get serial port by device ID
   */
  private async getPortById(deviceId: string): Promise<SerialPort | null> {
    try {
      const ports = await navigator.serial.getPorts();
      
      for (const port of ports) {
        const info = port.getInfo();
        const portId = this.generateDeviceId(info);
        
        if (portId === deviceId) {
          return port;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting port by ID:', error);
      return null;
    }
  }

  /**
   * Generate device ID from port info
   */
  private generateDeviceId(info: SerialPortInfo): string {
    return `serial_${info.usbVendorId || 'unknown'}_${info.usbProductId || 'unknown'}`;
  }

  /**
   * Get device name from port info
   */
  private getDeviceName(info: SerialPortInfo): string {
    const vendorNames: { [key: number]: string } = {
      0x2341: 'Arduino',
      0x10C4: 'Silicon Labs',
      0x1A86: 'QinHeng Electronics',
      0x0403: 'FTDI',
      0x067B: 'Prolific',
      0x04D8: 'Microchip'
    };

    const vendorName = info.usbVendorId ? vendorNames[info.usbVendorId] || 'Unknown' : 'Unknown';
    const productId = info.usbProductId ? info.usbProductId.toString(16).toUpperCase() : 'Unknown';
    
    return `${vendorName} Device (${productId})`;
  }

  /**
   * Get connection status of all devices
   */
  getConnectionStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    
    this.connectedPorts.forEach((port, deviceId) => {
      status.set(deviceId, port.readable !== null && port.writable !== null);
    });
    
    return status;
  }

  /**
   * Set device configuration
   */
  setDeviceConfig(deviceId: string, config: SerialDeviceConfig): void {
    this.deviceConfigs.set(deviceId, config);
  }

  /**
   * Get device configuration
   */
  getDeviceConfig(deviceId: string): SerialDeviceConfig | undefined {
    return this.deviceConfigs.get(deviceId);
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.connectedPorts.keys()).map(deviceId =>
      this.disconnectDevice(deviceId)
    );
    
    await Promise.all(disconnectPromises);
  }
}
