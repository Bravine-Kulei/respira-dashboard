# IoT Integration Branch

This branch contains the complete IoT integration system for the RespiraMate Dashboard, enabling easy connection and communication with various IoT devices.

## 🚀 What's New

### Core IoT Services
- **IoTManager** - Central hub for device management
- **BluetoothService** - Web Bluetooth API integration
- **WiFiService** - WebSocket/HTTP device communication
- **SerialService** - USB/Serial device support

### React Components
- **IoTDeviceManager** - Device discovery and connection UI
- **IoTDataDisplay** - Real-time data visualization
- **useIoTConnection** - React hook for device integration

### Configuration System
- **iot-config.ts** - Centralized configuration management
- Environment-specific settings
- Runtime configuration updates
- Validation and error handling

## 📁 New File Structure

```
src/
├── services/iot/
│   ├── IoTManager.ts          # Central IoT management
│   ├── BluetoothService.ts    # Bluetooth device handling
│   ├── WiFiService.ts         # WiFi device communication
│   └── SerialService.ts       # Serial/USB device support
├── hooks/
│   └── useIoTConnection.ts    # React hook for IoT integration
├── components/
│   ├── IoTDeviceManager.tsx   # Device management UI
│   └── IoTDataDisplay.tsx     # Real-time data display
├── config/
│   └── iot-config.ts          # IoT configuration system
docs/
├── IOT_INTEGRATION_GUIDE.md   # Complete integration guide
└── DEVICE_PROTOCOLS.md        # Device communication protocols
```

## 🔧 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Basic Usage
```typescript
import { useIoTConnection } from './hooks/useIoTConnection';
import { IoTDeviceManager } from './components/IoTDeviceManager';

function App() {
  const [state, actions] = useIoTConnection({
    autoScan: true,
    autoReconnect: true
  });

  return (
    <div>
      <IoTDeviceManager />
      {state.lastData && (
        <div>Heart Rate: {state.lastData.heartRate} BPM</div>
      )}
    </div>
  );
}
```

### 3. Device Integration
```typescript
import { iotManager } from './services/iot/IoTManager';

// Scan for devices
const devices = await iotManager.scanForDevices();

// Connect to device
await iotManager.connectToDevice(deviceId);

// Listen for data
iotManager.onDataReceived((data) => {
  console.log('Received:', data);
});
```

## 🔌 Supported Connection Types

### Bluetooth Low Energy
- **Requirements**: Modern browser with Web Bluetooth support, HTTPS
- **Use Case**: Wireless inhalers, wearable devices
- **Protocol**: Binary data packets with custom UUIDs

### WiFi/WebSocket
- **Requirements**: Network connectivity to device
- **Use Case**: Smart hubs, stationary sensors
- **Protocol**: JSON messages over WebSocket

### Serial/USB
- **Requirements**: Web Serial API support, user permission
- **Use Case**: Development devices, direct connections
- **Protocol**: JSON or CSV data over serial

## 📊 Features

### Device Management
- ✅ Automatic device discovery
- ✅ Connection status monitoring
- ✅ Automatic reconnection
- ✅ Error handling and recovery
- ✅ Multiple connection types

### Data Handling
- ✅ Real-time data streaming
- ✅ Data validation and filtering
- ✅ Historical data storage
- ✅ Chart visualization
- ✅ Export functionality

### User Interface
- ✅ Device manager component
- ✅ Real-time data display
- ✅ Connection quality indicators
- ✅ Error notifications
- ✅ Responsive design

## 🛠️ Configuration

### Environment Variables
```env
REACT_APP_IOT_DEBUG=true
REACT_APP_IOT_AUTO_SCAN=true
REACT_APP_IOT_SCAN_INTERVAL=30000
```

### Device Configuration
```typescript
import { IoTConfigManager } from './config/iot-config';

const config = IoTConfigManager.getInstance();
config.updateConfig({
  wifi: {
    knownDevices: [{
      id: 'my-device',
      name: 'My RespiraMate Device',
      ip: '192.168.1.100',
      port: 8080,
      protocol: 'ws',
      deviceType: 'inhaler'
    }]
  }
});
```

## 📱 Device Implementation

### Arduino Bluetooth Example
```cpp
#include <ArduinoBLE.h>

BLEService service("12345678-1234-1234-1234-123456789abc");
BLECharacteristic dataChar("11111111-1111-1111-1111-111111111111", BLERead | BLENotify, 20);

void setup() {
  BLE.begin();
  BLE.setLocalName("RespiraMate-Inhaler");
  // ... setup code
}

void loop() {
  // Send sensor data
  uint8_t data[6] = {0x01, 0x02, 75, 0x00, 0x02, 0x02}; // Heart rate: 75
  dataChar.writeValue(data, 6);
  delay(1000);
}
```

### ESP32 WiFi Example
```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>

void sendData() {
  String json = "{\"type\":\"data\",\"data\":{\"heartRate\":75}}";
  webSocket.broadcastTXT(json);
}
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Device Connections
```bash
# Test Bluetooth
npm run test:bluetooth

# Test WiFi
npm run test:wifi -- --ip 192.168.1.100

# Test Serial
npm run test:serial -- --port COM3
```

## 🌐 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Bluetooth | ✅ | ❌ | ❌ | ✅ |
| Serial | ✅ | ❌ | ❌ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |

## 🔒 Security

- **HTTPS Required** for Bluetooth and Serial APIs
- **User Permissions** required for all device access
- **Data Validation** on all incoming device data
- **API Key Support** for WiFi device authentication

## 📚 Documentation

- **[IoT Integration Guide](docs/IOT_INTEGRATION_GUIDE.md)** - Complete setup and usage guide
- **[Device Protocols](docs/DEVICE_PROTOCOLS.md)** - Communication protocol specifications
- **Inline Code Documentation** - JSDoc comments throughout codebase

## 🚀 Deployment

### Production Checklist
- [ ] HTTPS enabled
- [ ] Error logging configured
- [ ] Device configurations validated
- [ ] Performance monitoring enabled
- [ ] Fallback UI for unsupported browsers

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure browser compatibility
5. Test with real devices when possible

## 🐛 Troubleshooting

### Common Issues

**Bluetooth not working:**
- Ensure HTTPS connection
- Check browser compatibility
- Verify device advertising

**WiFi devices not connecting:**
- Check network connectivity
- Verify IP and port
- Ensure WebSocket server running

**Serial devices not detected:**
- Check Web Serial API support
- Verify USB drivers
- Try different baud rates

### Debug Mode
```typescript
import { getIoTConfig } from './config/iot-config';
const config = getIoTConfig();
config.general.logging.level = 'debug';
```

## 📈 Performance

- **Optimized Data Flow** - Efficient data processing pipeline
- **Connection Pooling** - Reuse WebSocket connections
- **Memory Management** - Automatic cleanup of old data
- **Error Recovery** - Graceful handling of connection issues

## 🔮 Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Machine learning integration
- [ ] Cloud data synchronization
- [ ] Mobile app companion
- [ ] Advanced alert system
- [ ] Multi-user support

## 📞 Support

- **Documentation**: Check the guides in `/docs`
- **Issues**: Report on GitHub repository
- **Examples**: See implementation examples in code
- **Community**: Join our Discord for real-time help

---

**Ready to integrate your IoT devices?** Start with the [IoT Integration Guide](docs/IOT_INTEGRATION_GUIDE.md) and explore the example implementations!
