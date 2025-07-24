# IoT Integration Guide

This guide explains how to integrate IoT devices with the RespiraMate Dashboard using the new IoT integration system.

## Overview

The IoT integration system supports multiple connection types:
- **Bluetooth** - Web Bluetooth API for wireless devices
- **WiFi** - WebSocket/HTTP connections for network devices  
- **Serial/USB** - Web Serial API for direct USB connections

## Quick Start

### 1. Basic Setup

```typescript
import { useIoTConnection } from '../hooks/useIoTConnection';

function MyComponent() {
  const [state, actions] = useIoTConnection({
    autoScan: true,
    autoReconnect: true
  });

  return (
    <div>
      <button onClick={actions.scanForDevices}>
        Scan for Devices
      </button>
      {state.devices.map(device => (
        <button 
          key={device.id}
          onClick={() => actions.connectToDevice(device.id)}
        >
          Connect to {device.name}
        </button>
      ))}
    </div>
  );
}
```

### 2. Using the Device Manager Component

```typescript
import { IoTDeviceManager } from '../components/IoTDeviceManager';

function Dashboard() {
  return (
    <IoTDeviceManager
      onDeviceConnected={(device) => console.log('Connected:', device)}
      onDeviceDisconnected={(device) => console.log('Disconnected:', device)}
    />
  );
}
```

### 3. Displaying Real-time Data

```typescript
import { IoTDataDisplay } from '../components/IoTDataDisplay';

function DataDashboard() {
  return (
    <IoTDataDisplay
      showCharts={true}
      refreshInterval={1000}
    />
  );
}
```

## Connection Types

### Bluetooth Devices

#### Requirements
- Modern browser with Web Bluetooth support
- HTTPS connection (required by Web Bluetooth API)
- User gesture to initiate connection

#### Device Configuration
```typescript
// Configure Bluetooth service UUIDs in iot-config.ts
bluetooth: {
  services: {
    inhaler: '12345678-1234-1234-1234-123456789abc',
    wearable: '87654321-4321-4321-4321-cba987654321'
  },
  characteristics: {
    data: '11111111-1111-1111-1111-111111111111',
    battery: '22222222-2222-2222-2222-222222222222',
    command: '33333333-3333-3333-3333-333333333333'
  }
}
```

#### Data Protocol
Bluetooth devices should send data in this format:
```
[type][length][data...]
0x01 = heart rate (2 bytes, little endian)
0x02 = air quality (2 bytes, little endian)  
0x03 = inhaler usage (2 bytes, little endian)
0x04 = battery level (1 byte)
```

### WiFi Devices

#### Requirements
- Device must support WebSocket or HTTP connections
- Same network as the dashboard (or accessible IP)

#### Device Configuration
```typescript
// Add known devices in iot-config.ts
wifi: {
  knownDevices: [
    {
      id: 'my-device-001',
      name: 'My RespiraMate Device',
      ip: '192.168.1.100',
      port: 8080,
      protocol: 'ws',
      deviceType: 'inhaler'
    }
  ]
}
```

#### WebSocket Protocol
WiFi devices should send JSON messages:
```json
{
  "type": "data",
  "data": {
    "heartRate": 75,
    "airQuality": 85,
    "inhalerUsage": 3,
    "inhalerBattery": 90
  },
  "timestamp": 1640995200000
}
```

### Serial/USB Devices

#### Requirements
- Modern browser with Web Serial API support
- User permission to access serial ports

#### Data Format
Serial devices can send data in multiple formats:

**JSON Format:**
```json
{"heartRate": 75, "airQuality": 85, "battery": 90}
```

**CSV Format:**
```
hr:75,aq:85,battery:90
```

## Device Implementation Examples

### Arduino Bluetooth Device

```cpp
#include <ArduinoBLE.h>

BLEService respiraMateService("12345678-1234-1234-1234-123456789abc");
BLECharacteristic dataCharacteristic("11111111-1111-1111-1111-111111111111", BLERead | BLENotify, 20);

void setup() {
  BLE.begin();
  BLE.setLocalName("RespiraMate-Inhaler");
  BLE.setAdvertisedService(respiraMateService);
  
  respiraMateService.addCharacteristic(dataCharacteristic);
  BLE.addService(respiraMateService);
  
  BLE.advertise();
}

void loop() {
  // Read sensor data
  int heartRate = readHeartRate();
  int airQuality = readAirQuality();
  
  // Pack data
  uint8_t data[8];
  data[0] = 0x01; // Heart rate type
  data[1] = 0x02; // Length
  data[2] = heartRate & 0xFF;
  data[3] = (heartRate >> 8) & 0xFF;
  data[4] = 0x02; // Air quality type  
  data[5] = 0x02; // Length
  data[6] = airQuality & 0xFF;
  data[7] = (airQuality >> 8) & 0xFF;
  
  dataCharacteristic.writeValue(data, 8);
  delay(1000);
}
```

### ESP32 WiFi Device

```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

WebSocketsServer webSocket = WebSocketsServer(8080);

void setup() {
  WiFi.begin("your-wifi", "password");
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  
  // Send data every second
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 1000) {
    sendSensorData();
    lastSend = millis();
  }
}

void sendSensorData() {
  DynamicJsonDocument doc(1024);
  doc["type"] = "data";
  doc["data"]["heartRate"] = readHeartRate();
  doc["data"]["airQuality"] = readAirQuality();
  doc["data"]["inhalerBattery"] = readBattery();
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  webSocket.broadcastTXT(message);
}
```

## Configuration

### Environment Variables

Create a `.env` file for environment-specific settings:

```env
# Development settings
REACT_APP_IOT_DEBUG=true
REACT_APP_IOT_AUTO_SCAN=true
REACT_APP_IOT_SCAN_INTERVAL=30000

# Production settings  
REACT_APP_IOT_DEBUG=false
REACT_APP_IOT_AUTO_SCAN=false
REACT_APP_IOT_LOG_LEVEL=warn
```

### Runtime Configuration

```typescript
import { IoTConfigManager } from '../config/iot-config';

const configManager = IoTConfigManager.getInstance();

// Update WiFi settings
configManager.updateConfig({
  wifi: {
    ...configManager.getConfig().wifi,
    knownDevices: [
      ...configManager.getConfig().wifi.knownDevices,
      {
        id: 'new-device',
        name: 'New Device',
        ip: '192.168.1.101',
        port: 8080,
        protocol: 'ws',
        deviceType: 'wearable'
      }
    ]
  }
});
```

## Troubleshooting

### Common Issues

1. **Bluetooth not working**
   - Ensure HTTPS connection
   - Check browser compatibility
   - Verify device is advertising with correct service UUID

2. **WiFi devices not connecting**
   - Check network connectivity
   - Verify IP address and port
   - Ensure WebSocket server is running on device

3. **Serial devices not detected**
   - Check browser support for Web Serial API
   - Verify USB drivers are installed
   - Try different baud rates

### Debug Mode

Enable debug logging:

```typescript
import { getIoTConfig } from '../config/iot-config';

const config = getIoTConfig();
config.general.logging.level = 'debug';
config.general.logging.enableConsole = true;
```

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Bluetooth | ✅ | ❌ | ❌ | ✅ |
| Web Serial | ✅ | ❌ | ❌ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |

## Security Considerations

1. **HTTPS Required** - Web Bluetooth and Web Serial APIs require HTTPS
2. **User Permissions** - All connections require explicit user consent
3. **Data Validation** - Always validate incoming device data
4. **API Keys** - Use API keys for WiFi device authentication when possible

## Performance Tips

1. **Limit Data Frequency** - Don't send data more than once per second
2. **Batch Updates** - Combine multiple sensor readings in one message
3. **Connection Pooling** - Reuse WebSocket connections when possible
4. **Data Compression** - Use binary protocols for high-frequency data

## API Reference

### IoTManager Class

```typescript
import { iotManager } from '../services/iot/IoTManager';

// Scan for devices
const devices = await iotManager.scanForDevices();

// Connect to device
const success = await iotManager.connectToDevice(deviceId);

// Send command
await iotManager.sendCommand(deviceId, 'calibrate', { sensor: 'heartRate' });

// Listen for data
const unsubscribe = iotManager.onDataReceived((data) => {
  console.log('Received:', data);
});

// Listen for status changes
iotManager.onStatusChanged((device) => {
  console.log('Device status:', device.status);
});
```

### useIoTConnection Hook

```typescript
const [state, actions] = useIoTConnection({
  autoScan: true,           // Auto-scan for devices
  autoReconnect: true,      // Auto-reconnect on disconnect
  scanInterval: 30000,      // Scan interval in ms
  dataRetentionTime: 300000 // Data retention time in ms
});

// State properties
state.devices              // All discovered devices
state.connectedDevices     // Currently connected devices
state.isScanning          // Scanning status
state.isConnecting        // Connection status
state.lastData            // Latest received data
state.connectionQuality   // Connection quality indicator
state.error               // Error message if any

// Action methods
actions.scanForDevices()           // Trigger device scan
actions.connectToDevice(id)        // Connect to specific device
actions.disconnectDevice(id)       // Disconnect device
actions.sendCommand(id, cmd, data) // Send command to device
actions.clearError()               // Clear error state
```

## Advanced Usage

### Custom Device Types

Add support for custom device types:

```typescript
// Extend device types
interface CustomDeviceInfo extends DeviceInfo {
  customProperty?: string;
  firmwareVersion?: string;
}

// Custom data format
interface CustomDeviceData extends DeviceData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
}
```

### Data Processing Pipeline

```typescript
import { iotManager } from '../services/iot/IoTManager';

// Add data processing middleware
iotManager.onDataReceived((rawData) => {
  // Validate data
  if (!isValidData(rawData)) {
    console.warn('Invalid data received:', rawData);
    return;
  }

  // Process data
  const processedData = {
    ...rawData,
    heartRate: smoothHeartRate(rawData.heartRate),
    airQuality: calibrateAirQuality(rawData.airQuality),
    timestamp: Date.now()
  };

  // Store in database
  saveToDatabase(processedData);

  // Trigger alerts if needed
  checkAlertThresholds(processedData);
});

function smoothHeartRate(value?: number): number | undefined {
  if (!value) return undefined;
  // Apply smoothing algorithm
  return Math.round(value * 0.8 + previousValue * 0.2);
}

function calibrateAirQuality(value?: number): number | undefined {
  if (!value) return undefined;
  // Apply calibration curve
  return Math.min(100, Math.max(0, value * 1.1 - 5));
}
```

### Error Handling

```typescript
import { iotManager } from '../services/iot/IoTManager';

// Global error handler
iotManager.onStatusChanged((device) => {
  if (device.status === 'error') {
    // Log error
    console.error(`Device ${device.name} error:`, device);

    // Notify user
    showNotification(`Connection lost to ${device.name}`, 'error');

    // Attempt recovery
    setTimeout(() => {
      iotManager.connectToDevice(device.id);
    }, 5000);
  }
});

// Connection timeout handling
const connectWithTimeout = async (deviceId: string, timeout = 10000) => {
  return Promise.race([
    iotManager.connectToDevice(deviceId),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeout)
    )
  ]);
};
```

### Data Persistence

```typescript
// Save data to localStorage
function saveDataToStorage(data: DeviceData) {
  const key = `iot_data_${new Date().toDateString()}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(data);

  // Keep only last 1000 entries
  if (existing.length > 1000) {
    existing.splice(0, existing.length - 1000);
  }

  localStorage.setItem(key, JSON.stringify(existing));
}

// Load historical data
function loadHistoricalData(date: Date): DeviceData[] {
  const key = `iot_data_${date.toDateString()}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}
```

## Testing

### Unit Tests

```typescript
// __tests__/iot-manager.test.ts
import { IoTManager } from '../services/iot/IoTManager';

describe('IoTManager', () => {
  let iotManager: IoTManager;

  beforeEach(() => {
    iotManager = new IoTManager();
  });

  test('should scan for devices', async () => {
    const devices = await iotManager.scanForDevices();
    expect(Array.isArray(devices)).toBe(true);
  });

  test('should handle connection errors gracefully', async () => {
    const result = await iotManager.connectToDevice('invalid-id');
    expect(result).toBe(false);
  });
});
```

### Integration Tests

```typescript
// __tests__/iot-integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IoTDeviceManager } from '../components/IoTDeviceManager';

test('should display device list', async () => {
  render(<IoTDeviceManager />);

  fireEvent.click(screen.getByText('Scan'));

  await waitFor(() => {
    expect(screen.getByText('Available Devices')).toBeInTheDocument();
  });
});
```

## Deployment

### Production Checklist

- [ ] HTTPS enabled (required for Web Bluetooth/Serial)
- [ ] Error logging configured
- [ ] Device configurations validated
- [ ] Connection timeouts set appropriately
- [ ] Data validation implemented
- [ ] User permissions handled gracefully
- [ ] Fallback UI for unsupported browsers
- [ ] Performance monitoring enabled

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Environment Configuration

```bash
# .env.production
REACT_APP_IOT_DEBUG=false
REACT_APP_IOT_LOG_LEVEL=error
REACT_APP_IOT_AUTO_SCAN=false
REACT_APP_IOT_SCAN_INTERVAL=60000
REACT_APP_IOT_CONNECTION_TIMEOUT=15000
```

## Support

### Browser Support Matrix

| Browser | Version | Bluetooth | Serial | WebSocket | Notes |
|---------|---------|-----------|--------|-----------|-------|
| Chrome | 56+ | ✅ | 89+ | ✅ | Full support |
| Edge | 79+ | ✅ | 89+ | ✅ | Full support |
| Firefox | Any | ❌ | ❌ | ✅ | WebSocket only |
| Safari | Any | ❌ | ❌ | ✅ | WebSocket only |

### Fallback Strategies

```typescript
// Feature detection and fallbacks
function getAvailableConnectionTypes() {
  const types = ['wifi']; // Always available

  if ('bluetooth' in navigator) {
    types.push('bluetooth');
  }

  if ('serial' in navigator) {
    types.push('serial');
  }

  return types;
}

// Progressive enhancement
function IoTManagerWithFallback() {
  const availableTypes = getAvailableConnectionTypes();

  if (availableTypes.length === 1) {
    return <WiFiOnlyManager />;
  }

  return <FullIoTManager availableTypes={availableTypes} />;
}
```

### Getting Help

- **Documentation**: Check this guide and inline code comments
- **Examples**: See the `examples/` directory for complete implementations
- **Issues**: Report bugs on the GitHub repository
- **Community**: Join our Discord server for real-time help

---

*This guide covers the complete IoT integration system. For device-specific implementation details, refer to the individual service documentation in the `src/services/iot/` directory.*
```
