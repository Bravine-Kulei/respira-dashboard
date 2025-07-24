import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LiveDataSection } from './components/LiveDataSection';
import { AlertPanel } from './components/AlertPanel';
import { AIPredictionPanel } from './components/AIPredictionPanel';
import { LogsHistory } from './components/LogsHistory';
import { DeviceSettings } from './components/DeviceSettings';
import { HelpSection } from './components/HelpSection';
import { audioService } from './services/AudioService';
import { aiHealthPredictor, HealthPrediction, HealthData } from './services/AIHealthPredictor';
// Helper function to generate random value within range
const randomInRange = (base: number, range: number) => {
  return Math.max(0, Math.round(base + Math.random() * range * 2 - range));
};
export function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [correlationTimer, setCorrelationTimer] = useState(0);
  // State for simulated data
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [airQuality, setAirQuality] = useState<number | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [inhalerBattery, setInhalerBattery] = useState<number | null>(null);
  const [wearableBattery, setWearableBattery] = useState<number | null>(null);

  // Fall detection and emergency state
  const [fallDetected, setFallDetected] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState({
    x: 0,
    y: 0,
    z: 9.8 // Normal gravity
  });

  // Voice announcement state
  const [voiceAnnouncementCountdown, setVoiceAnnouncementCountdown] = useState<number | null>(null);

  // AI Prediction state
  const [aiPrediction, setAiPrediction] = useState<HealthPrediction>({
    riskLevel: 'low',
    prediction: 'Initializing AI health monitoring system...',
    confidence: 60,
    timeframe: 'Next 2-4 hours',
    recommendations: ['Connect device to begin AI analysis'],
    triggers: [],
    riskScore: 20,
    nextUpdate: Date.now() + (5 * 60 * 1000)
  });
  const [showAIPrediction, setShowAIPrediction] = useState(true);
  const [predictionHistory, setPredictionHistory] = useState<Array<{
    timestamp: number;
    riskScore: number;
    riskLevel: string;
  }>>([]);
  // State for historical data logs
  const [dataLogs, setDataLogs] = useState<Array<{
    time: string;
    heartRate: number;
    airQuality: number;
    usage: number;
  }>>([]);
  // Mock threshold settings
  const [thresholds, setThresholds] = useState({
    heartRateThreshold: 90,
    airQualityThreshold: 80,
    notificationsEnabled: true
  });

  // Emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      phone: '+1-555-0123',
      email: 'dr.johnson@hospital.com',
      relationship: 'Primary Doctor',
      priority: 'high' as const
    },
    {
      id: '2',
      name: 'John Smith',
      phone: '+1-555-0456',
      email: 'john.smith@email.com',
      relationship: 'Emergency Contact',
      priority: 'high' as const
    },
    {
      id: '3',
      name: 'Mary Smith',
      phone: '+1-555-0789',
      email: 'mary.smith@email.com',
      relationship: 'Family Member',
      priority: 'medium' as const
    }
  ]);
  // Live data object
  const liveData = {
    heartRate,
    airQuality,
    usageCount,
    connectionStatus: isConnected ? 'Connected' : 'Disconnected',
    inhalerBattery,
    wearableBattery,
    fallDetected,
    accelerometerData
  };
  // Initialize data when connected
  useEffect(() => {
    if (isConnected) {
      // Set initial values
      setHeartRate(78);
      setAirQuality(92);
      setUsageCount(0);
      setInhalerBattery(85);
      setWearableBattery(62);

      // Initial log entry
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      setDataLogs([{
        time: formattedTime,
        heartRate: 78,
        airQuality: 92,
        usage: 0
      }]);

      // Voice announcement countdown and timer
      setVoiceAnnouncementCountdown(10);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setVoiceAnnouncementCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Voice announcement after 10 seconds
      const announcementTimer = setTimeout(() => {
        audioService.playConnectionAnnouncement();
        setVoiceAnnouncementCountdown(null);
      }, 10000);

      // Cleanup timers if component unmounts or disconnects
      return () => {
        clearTimeout(announcementTimer);
        clearInterval(countdownInterval);
        setVoiceAnnouncementCountdown(null);
      };
    } else {
      // Reset values when disconnected
      setHeartRate(null);
      setAirQuality(null);
      setUsageCount(null);
      setInhalerBattery(null);
      setWearableBattery(null);
    }
  }, [isConnected]);
  // Simulate heart rate changes and feed AI
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected && heartRate !== null) {
      interval = setInterval(() => {
        setHeartRate(prev => {
          if (prev === null) return null;
          // Simulate natural heart rate variations
          const newHeartRate = randomInRange(prev, 3);

          // Feed data to AI predictor when we have all required data
          if (airQuality !== null && usageCount !== null) {
            const healthData: HealthData = {
              timestamp: Date.now(),
              heartRate: newHeartRate,
              airQuality,
              usageCount,
              accelerometerData
            };

            aiHealthPredictor.addDataPoint(healthData);
          }

          return newHeartRate;
        });
      }, 3000); // Update every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, heartRate, airQuality, usageCount, accelerometerData]);
  // Simulate air quality changes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected && airQuality !== null) {
      interval = setInterval(() => {
        setAirQuality(prev => {
          if (prev === null) return null;
          // Air quality changes more slowly
          return Math.min(100, Math.max(60, randomInRange(prev, 2)));
        });
      }, 5000); // Update every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, airQuality]);
  // Simulate inhaler usage
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected) {
      interval = setInterval(() => {
        // 10% chance of using inhaler
        if (Math.random() < 0.1) {
          setUsageCount(prev => {
            if (prev === null) return 1;
            return prev + 1;
          });
        }
      }, 15000); // Check every 15 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);
  // Simulate battery drain
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected && inhalerBattery !== null && wearableBattery !== null) {
      interval = setInterval(() => {
        setInhalerBattery(prev => {
          if (prev === null) return null;
          return Math.max(0, prev - 0.2); // Slow drain
        });
        setWearableBattery(prev => {
          if (prev === null) return null;
          return Math.max(0, prev - 0.3); // Slightly faster drain
        });
      }, 10000); // Update every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, inhalerBattery, wearableBattery]);
  // Update logs periodically
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected && heartRate !== null && airQuality !== null && usageCount !== null) {
      interval = setInterval(() => {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        setDataLogs(prev => {
          const newLog = {
            time: formattedTime,
            heartRate: heartRate,
            airQuality: airQuality,
            usage: usageCount
          };
          // Keep only the most recent 20 logs
          const updatedLogs = [newLog, ...prev].slice(0, 20);
          return updatedLogs;
        });
      }, 60000); // Add a log entry every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, heartRate, airQuality, usageCount]);
  // Update sync time periodically when connected
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected) {
      // Initial sync time
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString());
      interval = setInterval(() => {
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString());
      }, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);
  // Simulate MPU6050 accelerometer data and fall detection
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected) {
      interval = setInterval(() => {
        // Simulate normal movement with small variations
        const baseX = Math.sin(Date.now() / 1000) * 0.5; // Gentle movement
        const baseY = Math.cos(Date.now() / 1500) * 0.3;
        const baseZ = 9.8 + Math.sin(Date.now() / 2000) * 0.2; // Gravity with small variations

        // Add random noise
        const x = baseX + (Math.random() - 0.5) * 0.2;
        const y = baseY + (Math.random() - 0.5) * 0.2;
        const z = baseZ + (Math.random() - 0.5) * 0.2;

        setAccelerometerData({ x, y, z });

        // Simulate fall detection (5% chance every 30 seconds)
        if (Math.random() < 0.002) { // Very low chance for demo
          simulateFall();
        }
      }, 100); // Update accelerometer data every 100ms
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const simulateFall = () => {
    // Simulate sudden acceleration change indicating a fall
    setAccelerometerData({
      x: (Math.random() - 0.5) * 20, // Sudden movement
      y: (Math.random() - 0.5) * 20,
      z: Math.random() * 5 // Reduced Z-axis (falling)
    });

    setFallDetected(true);

    // Reset fall detection after 10 seconds
    setTimeout(() => {
      setFallDetected(false);
      setAccelerometerData({
        x: 0,
        y: 0,
        z: 9.8
      });
    }, 10000);
  };

  // AI Prediction Updates
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isConnected && heartRate !== null && airQuality !== null && usageCount !== null) {
      // Generate initial prediction
      const currentData: HealthData = {
        timestamp: Date.now(),
        heartRate,
        airQuality,
        usageCount,
        accelerometerData
      };

      const prediction = aiHealthPredictor.generatePrediction(currentData);
      setAiPrediction(prediction);

      // Update prediction history
      setPredictionHistory(prev => {
        const newEntry = {
          timestamp: Date.now(),
          riskScore: prediction.riskScore,
          riskLevel: prediction.riskLevel
        };
        const updated = [...prev, newEntry];
        // Keep only last 24 entries (24 hours if updated hourly)
        return updated.slice(-24);
      });

      // Set up regular prediction updates every 5 minutes
      interval = setInterval(() => {
        const currentData: HealthData = {
          timestamp: Date.now(),
          heartRate: heartRate || 0,
          airQuality: airQuality || 0,
          usageCount: usageCount || 0,
          accelerometerData
        };

        const newPrediction = aiHealthPredictor.generatePrediction(currentData);
        setAiPrediction(newPrediction);

        // Update prediction history
        setPredictionHistory(prev => {
          const newEntry = {
            timestamp: Date.now(),
            riskScore: newPrediction.riskScore,
            riskLevel: newPrediction.riskLevel
          };
          const updated = [...prev, newEntry];
          return updated.slice(-24);
        });

        // Voice announcement for high-risk predictions
        if (newPrediction.riskLevel === 'high' || newPrediction.riskLevel === 'critical') {
          audioService.speakText(
            `AI health alert: ${newPrediction.prediction.split('.')[0]}. Please check your recommendations.`,
            { rate: 1.0, pitch: 1.1, volume: 0.8 }
          );
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, heartRate, airQuality, usageCount, accelerometerData]);

  // Determine alert status based on thresholds and AI predictions
  const determineAlertStatus = (): 'normal' | 'warning' | 'critical' | 'emergency' => {
    if (!isConnected) return 'warning';

    // Emergency status for fall detection
    if (fallDetected) return 'emergency';

    // Emergency status for AI critical predictions
    if (aiPrediction.riskLevel === 'critical') return 'emergency';

    // Emergency status for severe health issues
    if (heartRate && heartRate > thresholds.heartRateThreshold + 20) {
      return 'emergency';
    }
    if (airQuality && airQuality < thresholds.airQualityThreshold - 20) {
      return 'emergency';
    }

    // Critical status for AI high risk or threshold breaches
    if (aiPrediction.riskLevel === 'high') return 'critical';
    if (heartRate && heartRate > thresholds.heartRateThreshold) {
      return 'critical';
    }
    if (airQuality && airQuality < thresholds.airQualityThreshold) {
      return 'critical';
    }

    return 'normal';
  };
  const alertStatus = determineAlertStatus();
  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  const handleEmergencyAlert = (alertType: string, data: {
    timestamp: string;
    heartRate: number | null;
    airQuality: number | null;
    fallDetected?: boolean;
    accelerometerData?: { x: number; y: number; z: number };
    location: string;
  }) => {
    console.log('Emergency Alert Triggered:', alertType, data);

    // In a real application, this would:
    // 1. Send SMS/Email to emergency contacts
    // 2. Call emergency services if configured
    // 3. Log the emergency event
    // 4. Trigger push notifications
    // 5. Update emergency contact dashboard

    // For demo purposes, we'll show a browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('RespiraMate Emergency Alert', {
        body: data.fallDetected
          ? 'Fall detected! Emergency contacts have been notified.'
          : 'Critical health emergency detected!',
        icon: '/favicon.ico',
        tag: 'emergency'
      });
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Test fall detection button (for demo purposes)
  const triggerTestFall = () => {
    if (isConnected) {
      simulateFall();
    }
  };
  // Enhanced correlation between metrics with timer dependency
  useEffect(() => {
    if (isConnected && heartRate !== null && airQuality !== null) {
      // Heart rate increases when air quality drops
      if (airQuality < 70) {
        setHeartRate(prev => prev ? Math.min(120, prev + randomInRange(0, 5)) : null);
      }
      
      // Simulate environmental patterns (worse air quality in evening)
      const hour = new Date().getHours();
      const environmentalFactor = hour > 18 || hour < 6 ? -5 : 0;
      
      setAirQuality(prev => prev ? 
        Math.max(30, Math.min(100, prev + randomInRange(environmentalFactor, 3))) : null
      );
    }
  }, [isConnected, correlationTimer]);

  // Timer for correlation updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setCorrelationTimer(prev => prev + 1);
      }, 8000); // Update correlations every 8 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Simulate connection drops and quality changes
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        // 5% chance of temporary disconnection
        if (Math.random() < 0.05) {
          setConnectionQuality('poor');
          setIsConnected(false);
          setTimeout(() => {
            setIsConnected(true);
            setConnectionQuality('excellent');
          }, 3000 + Math.random() * 5000);
        } else {
          // Random connection quality changes
          const qualities: ('excellent' | 'good' | 'poor')[] = ['excellent', 'good', 'poor'];
          const weights = [0.7, 0.25, 0.05]; // Mostly excellent, sometimes good, rarely poor
          const random = Math.random();
          let cumulative = 0;
          for (let i = 0; i < qualities.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
              setConnectionQuality(qualities[i]);
              break;
            }
          }
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onConnect={handleConnect} 
        isConnected={isConnected} 
        lastSyncTime={lastSyncTime} 
        onHelpToggle={() => setShowHelp(!showHelp)}
        connectionQuality={connectionQuality}
      />
      <main className="container mx-auto px-4 py-6">
        {showHelp && <HelpSection onClose={() => setShowHelp(false)} />}
        <LiveDataSection data={liveData} />
        {/* AI Prediction Panel */}
        <AIPredictionPanel
          prediction={aiPrediction}
          isVisible={showAIPrediction}
          onToggleVisibility={() => setShowAIPrediction(!showAIPrediction)}
          predictionHistory={predictionHistory}
        />

        <AlertPanel
          status={alertStatus}
          thresholds={thresholds}
          liveData={liveData}
          emergencyContacts={emergencyContacts}
          onEmergencyAlert={handleEmergencyAlert}
        />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            {isConnected && liveData.inhalerBattery !== null && liveData.wearableBattery !== null && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div>Last synced: {lastSyncTime || 'Never'}</div>
              </div>
            )}

            {/* Voice Announcement Countdown */}
            {voiceAnnouncementCountdown !== null && (
              <div className="flex items-center space-x-2 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Voice announcement in {voiceAnnouncementCountdown}s</span>
              </div>
            )}

            {/* Test Fall Detection Button (Demo) */}
            {isConnected && (
              <button
                onClick={triggerTestFall}
                className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                title="Simulate fall detection for testing"
              >
                Test Fall Detection
              </button>
            )}
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="text-sm text-blue-600 hover:text-blue-800">
            {showSettings ? 'Hide Settings' : 'Show Device Settings'}
          </button>
        </div>
        {showSettings && (
          <DeviceSettings
            initialSettings={thresholds}
            onSettingsChange={setThresholds}
            emergencyContacts={emergencyContacts}
            onEmergencyContactsChange={setEmergencyContacts}
          />
        )}
        <LogsHistory isConnected={isConnected} logs={dataLogs} />
      </main>
    </div>
  );
}