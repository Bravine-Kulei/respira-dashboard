# Device Communication Protocols

This document describes the communication protocols for different types of IoT devices supported by the RespiraMate Dashboard.

## Overview

The dashboard supports three main communication protocols:
1. **Bluetooth Low Energy (BLE)** - For wireless devices
2. **WebSocket/HTTP** - For WiFi-enabled devices
3. **Serial/USB** - For direct-connected devices

## Bluetooth Low Energy (BLE) Protocol

### Service and Characteristic UUIDs

```
Primary Service: 12345678-1234-1234-1234-123456789abc (Inhaler)
Primary Service: 87654321-4321-4321-4321-cba987654321 (Wearable)

Characteristics:
- Data:    11111111-1111-1111-1111-111111111111 (Read, Notify)
- Battery: 22222222-2222-2222-2222-222222222222 (Read, Notify)
- Command: 33333333-3333-3333-3333-333333333333 (Write)
- Status:  44444444-4444-4444-4444-444444444444 (Read, Notify)
```

### Data Format

Data is transmitted as binary packets with the following structure:

```
[Type][Length][Data...]

Type (1 byte):
0x01 = Heart Rate
0x02 = Air Quality
0x03 = Inhaler Usage
0x04 = Battery Level
0x05 = Temperature
0x06 = Humidity
0x07 = Pressure

Length (1 byte):
Number of data bytes following

Data (variable):
Little-endian format for multi-byte values
```

### Example Data Packets

**Heart Rate (75 BPM):**
```
0x01 0x02 0x4B 0x00
```

**Air Quality (85%):**
```
0x02 0x02 0x55 0x00
```

**Battery Level (90%):**
```
0x04 0x01 0x5A
```

**Combined Packet:**
```
0x01 0x02 0x4B 0x00 0x02 0x02 0x55 0x00 0x04 0x01 0x5A
```

### Command Format

Commands are sent as UTF-8 encoded strings:

```
"CALIBRATE"           - Calibrate sensors
"RESET"              - Reset device
"SET_INTERVAL:1000"  - Set data interval to 1000ms
"GET_INFO"           - Get device information
"SYNC_TIME:1640995200" - Sync device time
```

### Status Responses

Status updates are sent as JSON strings:

```json
{
  "status": "ready|calibrating|error",
  "firmware": "1.2.3",
  "uptime": 12345,
  "lastCalibration": 1640995200,
  "errorCode": 0
}
```

## WebSocket Protocol

### Connection

Connect to device WebSocket endpoint:
```
ws://[device-ip]:[port]/ws
```

### Message Format

All messages are JSON objects with a `type` field:

```json
{
  "type": "message_type",
  "timestamp": 1640995200000,
  "data": { ... }
}
```

### Message Types

#### 1. Authentication (Client → Device)

```json
{
  "type": "auth",
  "apiKey": "your-api-key",
  "timestamp": 1640995200000
}
```

#### 2. Data (Device → Client)

```json
{
  "type": "data",
  "timestamp": 1640995200000,
  "data": {
    "heartRate": 75,
    "airQuality": 85,
    "inhalerUsage": 3,
    "inhalerBattery": 90,
    "wearableBattery": 75,
    "temperature": 22.5,
    "humidity": 45.2,
    "pressure": 1013.25
  }
}
```

#### 3. Status (Device → Client)

```json
{
  "type": "status",
  "timestamp": 1640995200000,
  "data": {
    "status": "connected",
    "signalStrength": -45,
    "uptime": 12345,
    "freeMemory": 2048,
    "errorCount": 0
  }
}
```

#### 4. Command (Client → Device)

```json
{
  "type": "command",
  "command": "calibrate",
  "timestamp": 1640995200000,
  "data": {
    "sensor": "heartRate",
    "duration": 30000
  }
}
```

#### 5. Response (Device → Client)

```json
{
  "type": "response",
  "commandId": "calibrate",
  "timestamp": 1640995200000,
  "success": true,
  "data": {
    "message": "Calibration completed",
    "result": { ... }
  }
}
```

#### 6. Error (Device → Client)

```json
{
  "type": "error",
  "timestamp": 1640995200000,
  "error": {
    "code": "SENSOR_ERROR",
    "message": "Heart rate sensor not responding",
    "details": { ... }
  }
}
```

### Heartbeat

Devices should send periodic heartbeat messages:

```json
{
  "type": "heartbeat",
  "timestamp": 1640995200000
}
```

## Serial/USB Protocol

### Connection Settings

```
Baud Rate: 115200
Data Bits: 8
Stop Bits: 1
Parity: None
Flow Control: None
```

### Data Format Options

#### 1. JSON Format (Recommended)

```json
{"heartRate": 75, "airQuality": 85, "battery": 90}
```

#### 2. CSV Format

```
hr:75,aq:85,battery:90
```

#### 3. Binary Format

Same as BLE binary format, but transmitted over serial.

### Command Format

Commands are sent as text lines ending with `\n`:

```
CALIBRATE\n
SET_INTERVAL:1000\n
GET_INFO\n
```

### Response Format

Responses are JSON objects:

```json
{"status": "ok", "command": "calibrate", "result": "success"}
```

## Device Implementation Examples

### Arduino BLE Device

```cpp
#include <ArduinoBLE.h>

// Service and characteristics
BLEService respiraMateService("12345678-1234-1234-1234-123456789abc");
BLECharacteristic dataChar("11111111-1111-1111-1111-111111111111", BLERead | BLENotify, 20);
BLECharacteristic batteryChar("22222222-2222-2222-2222-222222222222", BLERead | BLENotify, 1);
BLECharacteristic commandChar("33333333-3333-3333-3333-333333333333", BLEWrite, 20);

void setup() {
  BLE.begin();
  BLE.setLocalName("RespiraMate-Inhaler");
  BLE.setAdvertisedService(respiraMateService);
  
  respiraMateService.addCharacteristic(dataChar);
  respiraMateService.addCharacteristic(batteryChar);
  respiraMateService.addCharacteristic(commandChar);
  
  BLE.addService(respiraMateService);
  BLE.advertise();
  
  commandChar.setEventHandler(BLEWritten, onCommandReceived);
}

void loop() {
  BLE.poll();
  
  if (BLE.connected()) {
    sendSensorData();
    delay(1000);
  }
}

void sendSensorData() {
  uint8_t data[10];
  int offset = 0;
  
  // Heart rate
  int heartRate = readHeartRate();
  data[offset++] = 0x01; // Type
  data[offset++] = 0x02; // Length
  data[offset++] = heartRate & 0xFF;
  data[offset++] = (heartRate >> 8) & 0xFF;
  
  // Air quality
  int airQuality = readAirQuality();
  data[offset++] = 0x02; // Type
  data[offset++] = 0x02; // Length
  data[offset++] = airQuality & 0xFF;
  data[offset++] = (airQuality >> 8) & 0xFF;
  
  // Battery
  int battery = readBattery();
  data[offset++] = 0x04; // Type
  data[offset++] = 0x01; // Length
  data[offset++] = battery;
  
  dataChar.writeValue(data, offset);
}

void onCommandReceived(BLEDevice central, BLECharacteristic characteristic) {
  String command = characteristic.value();
  
  if (command == "CALIBRATE") {
    calibrateSensors();
  } else if (command.startsWith("SET_INTERVAL:")) {
    int interval = command.substring(13).toInt();
    setDataInterval(interval);
  }
}
```

### ESP32 WiFi Device

```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

WebSocketsServer webSocket = WebSocketsServer(8080);

void setup() {
  WiFi.begin("your-ssid", "your-password");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }
  
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 1000) {
    sendSensorData();
    lastSend = millis();
  }
}

void sendSensorData() {
  DynamicJsonDocument doc(1024);
  doc["type"] = "data";
  doc["timestamp"] = millis();
  doc["data"]["heartRate"] = readHeartRate();
  doc["data"]["airQuality"] = readAirQuality();
  doc["data"]["inhalerBattery"] = readBattery();
  
  String message;
  serializeJson(doc, message);
  webSocket.broadcastTXT(message);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_TEXT: {
      DynamicJsonDocument doc(1024);
      deserializeJson(doc, payload);
      
      if (doc["type"] == "command") {
        handleCommand(doc["command"], doc["data"]);
      }
      break;
    }
  }
}

void handleCommand(String command, JsonObject data) {
  if (command == "calibrate") {
    calibrateSensors();
    sendResponse("calibrate", true, "Calibration completed");
  }
}

void sendResponse(String commandId, bool success, String message) {
  DynamicJsonDocument doc(1024);
  doc["type"] = "response";
  doc["commandId"] = commandId;
  doc["success"] = success;
  doc["data"]["message"] = message;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  webSocket.broadcastTXT(response);
}
```

## Error Handling

### Common Error Codes

| Code | Description | Recovery |
|------|-------------|----------|
| `SENSOR_ERROR` | Sensor not responding | Restart device |
| `CALIBRATION_FAILED` | Calibration unsuccessful | Retry calibration |
| `LOW_BATTERY` | Battery level critical | Replace/charge battery |
| `MEMORY_ERROR` | Insufficient memory | Restart device |
| `NETWORK_ERROR` | Network connectivity lost | Check network settings |

### Error Response Format

```json
{
  "type": "error",
  "timestamp": 1640995200000,
  "error": {
    "code": "SENSOR_ERROR",
    "message": "Heart rate sensor not responding",
    "severity": "critical|warning|info",
    "recoverable": true,
    "details": {
      "sensor": "heartRate",
      "lastReading": 1640995100000,
      "attempts": 3
    }
  }
}
```

## Testing and Validation

### Protocol Compliance Testing

Use the provided test utilities to validate your device implementation:

```bash
# Test Bluetooth device
npm run test:bluetooth -- --device-name "RespiraMate-Inhaler"

# Test WiFi device  
npm run test:wifi -- --ip 192.168.1.100 --port 8080

# Test Serial device
npm run test:serial -- --port COM3 --baud 115200
```

### Data Validation

All incoming data is validated against these rules:

- Heart rate: 30-200 BPM
- Air quality: 0-100%
- Battery: 0-100%
- Temperature: -40 to 85°C
- Humidity: 0-100%
- Pressure: 300-1100 hPa

Invalid data will be logged and ignored.

---

*For implementation assistance, refer to the IoT Integration Guide and example code in the repository.*
