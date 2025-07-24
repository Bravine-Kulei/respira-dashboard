/**
 * WiFi Service - Handles WiFi-connected IoT devices via WebSocket/HTTP
 * Supports device discovery and real-time communication
 */

import { DeviceData, DeviceInfo } from './IoTManager';

export interface WiFiDeviceConfig {
  ip: string;
  port: number;
  protocol: 'ws' | 'wss' | 'http' | 'https';
  apiKey?: string;
  deviceType: 'inhaler' | 'wearable' | 'sensor';
}

export interface WiFiServiceConfig {
  discoveryPort: number;
  discoveryTimeout: number;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export class WiFiService {
  private config: WiFiServiceConfig;
  private connections: Map<string, WebSocket> = new Map();
  private deviceConfigs: Map<string, WiFiDeviceConfig> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<WiFiServiceConfig>) {
    this.config = {
      discoveryPort: 8080,
      discoveryTimeout: 5000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      ...config
    };
  }

  /**
   * Discover WiFi devices on the local network
   */
  async discoverDevices(): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = [];
    
    try {
      // Method 1: Try known device IPs
      const knownDevices = await this.scanKnownDevices();
      devices.push(...knownDevices);

      // Method 2: mDNS discovery (if supported)
      const mdnsDevices = await this.discoverViaMDNS();
      devices.push(...mdnsDevices);

      // Method 3: Network scan (limited by browser security)
      const networkDevices = await this.scanLocalNetwork();
      devices.push(...networkDevices);

    } catch (error) {
      console.error('Error discovering WiFi devices:', error);
    }

    return devices;
  }

  /**
   * Connect to a WiFi device
   */
  async connectToDevice(deviceId: string, config: WiFiDeviceConfig): Promise<boolean> {
    try {
      this.deviceConfigs.set(deviceId, config);
      
      const url = this.buildWebSocketURL(config);
      const ws = new WebSocket(url);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, this.config.discoveryTimeout);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log(`Connected to WiFi device: ${deviceId}`);
          
          this.connections.set(deviceId, ws);
          this.setupWebSocketHandlers(deviceId, ws);
          this.resetReconnectAttempts(deviceId);
          
          // Send authentication if API key is provided
          if (config.apiKey) {
            this.sendAuthentication(ws, config.apiKey);
          }
          
          resolve(true);
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`Error connecting to device ${deviceId}:`, error);
          reject(error);
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          this.handleDisconnection(deviceId);
        };
      });

    } catch (error) {
      console.error(`Failed to connect to WiFi device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from a WiFi device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const ws = this.connections.get(deviceId);
      if (ws) {
        ws.close();
        this.connections.delete(deviceId);
      }

      // Clear reconnection timer
      const timer = this.reconnectTimers.get(deviceId);
      if (timer) {
        clearTimeout(timer);
        this.reconnectTimers.delete(deviceId);
      }

      this.deviceConfigs.delete(deviceId);
      this.reconnectAttempts.delete(deviceId);
      
      return true;
    } catch (error) {
      console.error(`Error disconnecting WiFi device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Send command to WiFi device
   */
  async sendCommand(deviceId: string, command: string, data?: any): Promise<boolean> {
    try {
      const ws = this.connections.get(deviceId);
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error(`Device ${deviceId} is not connected`);
      }

      const message = {
        type: 'command',
        command,
        data,
        timestamp: Date.now()
      };

      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending command to WiFi device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Add a known device configuration
   */
  addKnownDevice(deviceId: string, config: WiFiDeviceConfig): void {
    this.deviceConfigs.set(deviceId, config);
  }

  /**
   * Remove a known device configuration
   */
  removeKnownDevice(deviceId: string): void {
    this.deviceConfigs.delete(deviceId);
  }

  /**
   * Get all known device configurations
   */
  getKnownDevices(): Map<string, WiFiDeviceConfig> {
    return new Map(this.deviceConfigs);
  }

  /**
   * Scan known devices for availability
   */
  private async scanKnownDevices(): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = [];
    
    for (const [deviceId, config] of this.deviceConfigs) {
      try {
        const isAvailable = await this.pingDevice(config);
        if (isAvailable) {
          devices.push({
            id: deviceId,
            name: `WiFi ${config.deviceType}`,
            type: config.deviceType,
            connectionType: 'wifi',
            status: 'disconnected'
          });
        }
      } catch (error) {
        console.error(`Error pinging device ${deviceId}:`, error);
      }
    }

    return devices;
  }

  /**
   * Discover devices via mDNS (limited browser support)
   */
  private async discoverViaMDNS(): Promise<DeviceInfo[]> {
    // Note: mDNS discovery is limited in browsers
    // This would typically require a browser extension or native app
    console.log('mDNS discovery not fully supported in browsers');
    return [];
  }

  /**
   * Scan local network (very limited in browsers)
   */
  private async scanLocalNetwork(): Promise<DeviceInfo[]> {
    // Note: Network scanning is heavily restricted in browsers for security
    // This is a placeholder for potential future implementations
    console.log('Local network scanning not supported in browsers');
    return [];
  }

  /**
   * Ping a device to check availability
   */
  private async pingDevice(config: WiFiDeviceConfig): Promise<boolean> {
    try {
      const url = `${config.protocol === 'ws' || config.protocol === 'wss' ? 'http' : config.protocol}://${config.ip}:${config.port}/ping`;
      
      const response = await fetch(url, {
        method: 'GET',
        timeout: this.config.discoveryTimeout,
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build WebSocket URL from config
   */
  private buildWebSocketURL(config: WiFiDeviceConfig): string {
    const protocol = config.protocol === 'https' ? 'wss' : 'ws';
    return `${protocol}://${config.ip}:${config.port}/ws`;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(deviceId: string, ws: WebSocket): void {
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(deviceId, message);
      } catch (error) {
        console.error(`Error parsing message from device ${deviceId}:`, error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for device ${deviceId}:`, error);
    };

    ws.onclose = () => {
      this.handleDisconnection(deviceId);
    };
  }

  /**
   * Handle incoming messages from devices
   */
  private handleMessage(deviceId: string, message: any): void {
    switch (message.type) {
      case 'data':
        this.handleDataMessage(deviceId, message);
        break;
      case 'status':
        this.handleStatusMessage(deviceId, message);
        break;
      case 'error':
        this.handleErrorMessage(deviceId, message);
        break;
      default:
        console.log(`Unknown message type from device ${deviceId}:`, message);
    }
  }

  /**
   * Handle data messages
   */
  private handleDataMessage(deviceId: string, message: any): void {
    const deviceData: DeviceData = {
      heartRate: message.data.heartRate,
      airQuality: message.data.airQuality,
      inhalerUsage: message.data.inhalerUsage,
      inhalerBattery: message.data.inhalerBattery,
      wearableBattery: message.data.wearableBattery,
      timestamp: message.timestamp || Date.now()
    };

    // This would be emitted through the IoT Manager
    console.log('Received data from WiFi device:', deviceId, deviceData);
  }

  /**
   * Handle status messages
   */
  private handleStatusMessage(deviceId: string, message: any): void {
    console.log(`Status update from device ${deviceId}:`, message.data);
  }

  /**
   * Handle error messages
   */
  private handleErrorMessage(deviceId: string, message: any): void {
    console.error(`Error from device ${deviceId}:`, message.error);
  }

  /**
   * Handle device disconnection
   */
  private handleDisconnection(deviceId: string): void {
    console.log(`WiFi device ${deviceId} disconnected`);
    this.connections.delete(deviceId);
    
    // Attempt reconnection if device config exists
    const config = this.deviceConfigs.get(deviceId);
    if (config) {
      this.scheduleReconnection(deviceId, config);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(deviceId: string, config: WiFiDeviceConfig): void {
    const attempts = this.reconnectAttempts.get(deviceId) || 0;
    
    if (attempts >= this.config.maxReconnectAttempts) {
      console.log(`Max reconnection attempts reached for device ${deviceId}`);
      return;
    }

    const timer = setTimeout(async () => {
      console.log(`Attempting to reconnect to device ${deviceId} (attempt ${attempts + 1})`);
      
      const success = await this.connectToDevice(deviceId, config);
      if (!success) {
        this.reconnectAttempts.set(deviceId, attempts + 1);
        this.scheduleReconnection(deviceId, config);
      }
    }, this.config.reconnectInterval);

    this.reconnectTimers.set(deviceId, timer);
  }

  /**
   * Reset reconnection attempts for a device
   */
  private resetReconnectAttempts(deviceId: string): void {
    this.reconnectAttempts.delete(deviceId);
    
    const timer = this.reconnectTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(deviceId);
    }
  }

  /**
   * Send authentication message
   */
  private sendAuthentication(ws: WebSocket, apiKey: string): void {
    const authMessage = {
      type: 'auth',
      apiKey,
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(authMessage));
  }

  /**
   * Get connection status of all devices
   */
  getConnectionStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    
    this.connections.forEach((ws, deviceId) => {
      status.set(deviceId, ws.readyState === WebSocket.OPEN);
    });
    
    return status;
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    // Close all WebSocket connections
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    // Clear all timers
    this.reconnectTimers.forEach((timer) => {
      clearTimeout(timer);
    });

    // Clear all maps
    this.connections.clear();
    this.reconnectTimers.clear();
    this.reconnectAttempts.clear();
  }
}
