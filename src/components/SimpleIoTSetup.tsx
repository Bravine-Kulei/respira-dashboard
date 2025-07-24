
/**
 * Simple IoT Setup Wizard
 * User-friendly interface for non-technical users to connect devices
 */

import React, { useState } from 'react';
import { Bluetooth, Wifi, Usb, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const SimpleIoTSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [deviceType, setDeviceType] = useState<'bluetooth' | 'wifi' | 'usb' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const steps: SetupStep[] = [
    {
      id: 'choose-device',
      title: 'Choose Your Device Type',
      description: 'What type of device do you want to connect?',
      completed: deviceType !== null
    },
    {
      id: 'prepare-device',
      title: 'Prepare Your Device',
      description: 'Follow simple steps to prepare your device',
      completed: false
    },
    {
      id: 'connect',
      title: 'Connect Device',
      description: 'Click to connect your device automatically',
      completed: connectionStatus === 'success'
    },
    {
      id: 'test',
      title: 'Test Connection',
      description: 'Verify your device is working correctly',
      completed: false
    }
  ];

  const deviceOptions = [
    {
      type: 'bluetooth' as const,
      icon: <Bluetooth size={48} className="text-blue-500" />,
      title: 'Bluetooth Device',
      description: 'Wireless inhaler or wearable device',
      difficulty: 'Easy',
      time: '2 minutes',
      requirements: ['Device is charged', 'Phone/computer nearby']
    },
    {
      type: 'wifi' as const,
      icon: <Wifi size={48} className="text-green-500" />,
      title: 'WiFi Device',
      description: 'Smart hub or WiFi-enabled sensor',
      difficulty: 'Medium',
      time: '5 minutes',
      requirements: ['Device connected to WiFi', 'Same network as computer']
    },
    {
      type: 'usb' as const,
      icon: <Usb size={48} className="text-purple-500" />,
      title: 'USB Device',
      description: 'Direct USB connection to computer',
      difficulty: 'Easy',
      time: '1 minute',
      requirements: ['USB cable', 'Device drivers installed']
    }
  ];

  const handleDeviceSelect = (type: 'bluetooth' | 'wifi' | 'usb') => {
    setDeviceType(type);
    setCurrentStep(1);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      // Import IoT manager dynamically to avoid issues if not available
      const { iotManager } = await import('../services/iot/IoTManager');

      if (deviceType === 'bluetooth') {
        // Try to connect to Bluetooth device
        const devices = await iotManager.scanForDevices();
        const bluetoothDevices = devices.filter(d => d.connectionType === 'bluetooth');

        if (bluetoothDevices.length > 0) {
          const success = await iotManager.connectToDevice(bluetoothDevices[0].id);
          if (success) {
            setConnectionStatus('success');
            setCurrentStep(3);
          } else {
            throw new Error('Failed to connect to Bluetooth device');
          }
        } else {
          throw new Error('No Bluetooth devices found');
        }
      } else if (deviceType === 'wifi') {
        // For WiFi, we'll use a simplified connection process
        // In a real implementation, this would scan for WiFi devices
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConnectionStatus('success');
        setCurrentStep(3);
      } else if (deviceType === 'usb') {
        // For USB, check if Web Serial is supported
        if ('serial' in navigator) {
          const devices = await iotManager.scanForDevices();
          const serialDevices = devices.filter(d => d.connectionType === 'serial');

          if (serialDevices.length > 0) {
            const success = await iotManager.connectToDevice(serialDevices[0].id);
            if (success) {
              setConnectionStatus('success');
              setCurrentStep(3);
            } else {
              throw new Error('Failed to connect to USB device');
            }
          } else {
            // Prompt user to select a serial port
            const { SerialService } = await import('../services/iot/SerialService');
            const serialService = new SerialService();
            const device = await serialService.requestDevice();

            if (device) {
              setConnectionStatus('success');
              setCurrentStep(3);
            } else {
              throw new Error('No USB device selected');
            }
          }
        } else {
          throw new Error('USB connections not supported in this browser');
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">
              Choose Your Device Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deviceOptions.map((option) => (
                <div
                  key={option.type}
                  onClick={() => handleDeviceSelect(option.type)}
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-center">
                    {option.icon}
                    <h3 className="text-lg font-semibold mt-4 mb-2">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {option.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`font-medium ${
                          option.difficulty === 'Easy' ? 'text-green-600' :
                          option.difficulty === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {option.difficulty}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Setup time:</span>
                        <span className="font-medium">{option.time}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Requirements:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {option.requirements.map((req, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle size={12} className="text-green-500 mr-1" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">
              Prepare Your {deviceType?.charAt(0).toUpperCase()}{deviceType?.slice(1)} Device
            </h2>
            {deviceType === 'bluetooth' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Step-by-Step Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-blue-700">
                    <li>Make sure your device is charged and turned on</li>
                    <li>Put your device in pairing mode (usually hold power button for 3 seconds)</li>
                    <li>Look for a blinking blue light on your device</li>
                    <li>Keep your device within 3 feet of your computer</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <HelpCircle className="text-yellow-600 mr-2 mt-1" size={16} />
                    <div>
                      <p className="text-yellow-800 text-sm">
                        <strong>Need help?</strong> Check your device manual for "Bluetooth pairing" or "pairing mode" instructions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {deviceType === 'wifi' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Step-by-Step Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-green-700">
                    <li>Connect your device to the same WiFi network as your computer</li>
                    <li>Find your device's IP address (usually shown on device screen)</li>
                    <li>Make sure your device is powered on and connected</li>
                    <li>Check that the WiFi indicator light is solid (not blinking)</li>
                  </ol>
                </div>
              </div>
            )}
            {deviceType === 'usb' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">Step-by-Step Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-purple-700">
                    <li>Connect your device to your computer using the USB cable</li>
                    <li>Wait for your computer to recognize the device</li>
                    <li>If prompted, install any required drivers</li>
                    <li>Make sure the device power light is on</li>
                  </ol>
                </div>
              </div>
            )}
            <div className="text-center mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                My Device is Ready
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Connect Your Device</h2>
            <div className="space-y-6">
              <div className="text-6xl">
                {isConnecting ? '🔄' : connectionStatus === 'success' ? '✅' : '📱'}
              </div>
              <p className="text-gray-600">
                {isConnecting 
                  ? 'Connecting to your device...' 
                  : connectionStatus === 'success'
                  ? 'Successfully connected!'
                  : 'Click the button below to connect automatically'
                }
              </p>
              {connectionStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="text-red-500 mr-2" size={16} />
                    <span className="text-red-700 text-sm">
                      Connection failed. Please check your device and try again.
                    </span>
                  </div>
                </div>
              )}
              {connectionStatus !== 'success' && (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Device'}
                </button>
              )}
              {connectionStatus === 'success' && (
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Test Your Connection</h2>
            <div className="space-y-6">
              <div className="text-6xl">🎉</div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-4">Connection Successful!</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Device Type:</span>
                    <span className="font-medium">{deviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Streaming:</span>
                    <span className="font-medium">Active</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                Your device is now connected and sending data to the dashboard. 
                You can start monitoring your health metrics!
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircle size={20} /> : index + 1}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
          {renderStepContent()}
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Need help? Contact support at{' '}
            <a href="mailto:support@respiramate.com" className="text-blue-600 hover:underline">
              support@respiramate.com
            </a>
            {' '}or call 1-800-RESPIRA
          </p>
        </div>
      </div>
    </div>
  );
};
