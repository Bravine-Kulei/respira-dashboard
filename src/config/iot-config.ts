/**
 * IoT Configuration
 * Central configuration for all IoT device connections and settings
 */

export interface IoTConfig {
  bluetooth: BluetoothConfig;
  wifi: WiFiConfig;
  serial: SerialConfig;
  general: GeneralConfig;
}

export interface BluetoothConfig {
  // Service UUIDs for different device types
  services: {
    inhaler: string;
    wearable: string;
    sensor: string;
  };
  
  // Characteristic UUIDs
  characteristics: {
    data: string;
    battery: string;
    command: string;
    status: string;
  };
  
  // Connection settings
  connectionTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  
  // Device filters for scanning
  deviceFilters: {
    namePrefix: string[];
    services: string[];
  };
}

export interface WiFiConfig {
  // Default ports for different protocols
  defaultPorts: {
    http: number;
    https: number;
    ws: number;
    wss: number;
  };
  
  // Discovery settings
  discovery: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  // Connection settings
  connection: {
    timeout: number;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
  
  // Known device configurations
  knownDevices: Array<{
    id: string;
    name: string;
    ip: string;
    port: number;
    protocol: 'ws' | 'wss' | 'http' | 'https';
    deviceType: 'inhaler' | 'wearable' | 'sensor';
    apiKey?: string;
  }>;
}

export interface SerialConfig {
  // Default serial port settings
  defaultSettings: {
    baudRate: number;
    dataBits: 7 | 8;
    stopBits: 1 | 2;
    parity: 'none' | 'even' | 'odd';
    flowControl: 'none' | 'hardware';
  };
  
  // USB vendor/product ID filters
  usbFilters: Array<{
    vendorId: number;
    productId?: number;
    description: string;
  }>;
  
  // Communication settings
  communication: {
    readTimeout: number;
    writeTimeout: number;
    bufferSize: number;
    lineEnding: string;
  };
  
  // Data parsing settings
  parsing: {
    dataFormat: 'json' | 'csv' | 'custom';
    delimiter: string;
    customParser?: string;
  };
}

export interface GeneralConfig {
  // Data retention settings
  dataRetention: {
    maxHistoryPoints: number;
    retentionTime: number; // milliseconds
    autoCleanup: boolean;
  };
  
  // Update intervals
  updateIntervals: {
    dataRefresh: number;
    statusCheck: number;
    deviceScan: number;
  };
  
  // Alert thresholds
  alertThresholds: {
    heartRate: {
      min: number;
      max: number;
    };
    airQuality: {
      min: number;
      max: number;
    };
    battery: {
      low: number;
      critical: number;
    };
    connectionTimeout: number;
  };
  
  // Logging settings
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableStorage: boolean;
    maxLogEntries: number;
  };
}

/**
 * Default IoT Configuration
 */
export const defaultIoTConfig: IoTConfig = {
  bluetooth: {
    services: {
      inhaler: '12345678-1234-1234-1234-123456789abc',
      wearable: '87654321-4321-4321-4321-cba987654321',
      sensor: '11111111-2222-3333-4444-555555555555'
    },
    characteristics: {
      data: '11111111-1111-1111-1111-111111111111',
      battery: '22222222-2222-2222-2222-222222222222',
      command: '33333333-3333-3333-3333-333333333333',
      status: '44444444-4444-4444-4444-444444444444'
    },
    connectionTimeout: 10000,
    reconnectAttempts: 3,
    reconnectDelay: 5000,
    deviceFilters: {
      namePrefix: ['RespiraMate', 'Inhaler', 'Wearable', 'RM-'],
      services: [
        '12345678-1234-1234-1234-123456789abc',
        '87654321-4321-4321-4321-cba987654321'
      ]
    }
  },
  
  wifi: {
    defaultPorts: {
      http: 80,
      https: 443,
      ws: 8080,
      wss: 8443
    },
    discovery: {
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 2000
    },
    connection: {
      timeout: 10000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    },
    knownDevices: [
      {
        id: 'respiramate-hub-001',
        name: 'RespiraMate Hub',
        ip: '192.168.1.100',
        port: 8080,
        protocol: 'ws',
        deviceType: 'sensor'
      }
    ]
  },
  
  serial: {
    defaultSettings: {
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none'
    },
    usbFilters: [
      { vendorId: 0x2341, description: 'Arduino' },
      { vendorId: 0x10C4, description: 'Silicon Labs' },
      { vendorId: 0x1A86, description: 'QinHeng Electronics' },
      { vendorId: 0x0403, description: 'FTDI' },
      { vendorId: 0x067B, description: 'Prolific' },
      { vendorId: 0x04D8, description: 'Microchip' }
    ],
    communication: {
      readTimeout: 5000,
      writeTimeout: 3000,
      bufferSize: 1024,
      lineEnding: '\n'
    },
    parsing: {
      dataFormat: 'json',
      delimiter: ',',
    }
  },
  
  general: {
    dataRetention: {
      maxHistoryPoints: 100,
      retentionTime: 300000, // 5 minutes
      autoCleanup: true
    },
    updateIntervals: {
      dataRefresh: 1000,
      statusCheck: 5000,
      deviceScan: 30000
    },
    alertThresholds: {
      heartRate: {
        min: 50,
        max: 120
      },
      airQuality: {
        min: 70,
        max: 100
      },
      battery: {
        low: 30,
        critical: 10
      },
      connectionTimeout: 15000
    },
    logging: {
      level: 'info',
      enableConsole: true,
      enableStorage: false,
      maxLogEntries: 1000
    }
  }
};

/**
 * Environment-specific configurations
 */
export const developmentConfig: Partial<IoTConfig> = {
  general: {
    ...defaultIoTConfig.general,
    logging: {
      ...defaultIoTConfig.general.logging,
      level: 'debug',
      enableConsole: true
    }
  }
};

export const productionConfig: Partial<IoTConfig> = {
  general: {
    ...defaultIoTConfig.general,
    logging: {
      ...defaultIoTConfig.general.logging,
      level: 'warn',
      enableConsole: false,
      enableStorage: true
    }
  }
};

/**
 * Get configuration based on environment
 */
export function getIoTConfig(): IoTConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return { ...defaultIoTConfig, ...productionConfig };
    case 'development':
    default:
      return { ...defaultIoTConfig, ...developmentConfig };
  }
}

/**
 * Validate configuration
 */
export function validateIoTConfig(config: IoTConfig): boolean {
  try {
    // Validate Bluetooth UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const bluetoothUUIDs = [
      ...Object.values(config.bluetooth.services),
      ...Object.values(config.bluetooth.characteristics)
    ];
    
    for (const uuid of bluetoothUUIDs) {
      if (!uuidRegex.test(uuid)) {
        console.error(`Invalid Bluetooth UUID: ${uuid}`);
        return false;
      }
    }
    
    // Validate WiFi ports
    const wifiPorts = Object.values(config.wifi.defaultPorts);
    for (const port of wifiPorts) {
      if (port < 1 || port > 65535) {
        console.error(`Invalid WiFi port: ${port}`);
        return false;
      }
    }
    
    // Validate serial baud rates
    const validBaudRates = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
    if (!validBaudRates.includes(config.serial.defaultSettings.baudRate)) {
      console.error(`Invalid serial baud rate: ${config.serial.defaultSettings.baudRate}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating IoT config:', error);
    return false;
  }
}

/**
 * Update configuration at runtime
 */
export class IoTConfigManager {
  private static instance: IoTConfigManager;
  private config: IoTConfig;
  
  private constructor() {
    this.config = getIoTConfig();
  }
  
  static getInstance(): IoTConfigManager {
    if (!IoTConfigManager.instance) {
      IoTConfigManager.instance = new IoTConfigManager();
    }
    return IoTConfigManager.instance;
  }
  
  getConfig(): IoTConfig {
    return this.config;
  }
  
  updateConfig(updates: Partial<IoTConfig>): boolean {
    try {
      const newConfig = { ...this.config, ...updates };
      
      if (validateIoTConfig(newConfig)) {
        this.config = newConfig;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating IoT config:', error);
      return false;
    }
  }
  
  resetToDefaults(): void {
    this.config = getIoTConfig();
  }
}
