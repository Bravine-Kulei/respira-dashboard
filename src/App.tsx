import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LiveDataSection } from './components/LiveDataSection';
import { AlertPanel } from './components/AlertPanel';
import { LogsHistory } from './components/LogsHistory';
import { DeviceSettings } from './components/DeviceSettings';
import { HelpSection } from './components/HelpSection';
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
  // Live data object
  const liveData = {
    heartRate,
    airQuality,
    usageCount,
    connectionStatus: isConnected ? 'Connected' : 'Disconnected',
    inhalerBattery,
    wearableBattery
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
    } else {
      // Reset values when disconnected
      setHeartRate(null);
      setAirQuality(null);
      setUsageCount(null);
      setInhalerBattery(null);
      setWearableBattery(null);
    }
  }, [isConnected]);
  // Simulate heart rate changes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isConnected && heartRate !== null) {
      interval = setInterval(() => {
        setHeartRate(prev => {
          if (prev === null) return null;
          // Simulate natural heart rate variations
          return randomInRange(prev, 3);
        });
      }, 3000); // Update every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, heartRate]);
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
  // Determine alert status based on thresholds
  const determineAlertStatus = () => {
    if (!isConnected) return 'warning';
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
        <AlertPanel status={alertStatus} thresholds={thresholds} liveData={liveData} />
        <div className="flex justify-between items-center mb-4">
          <div>
            {isConnected && liveData.inhalerBattery !== null && liveData.wearableBattery !== null && <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div>Last synced: {lastSyncTime || 'Never'}</div>
                </div>}
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="text-sm text-blue-600 hover:text-blue-800">
            {showSettings ? 'Hide Settings' : 'Show Device Settings'}
          </button>
        </div>
        {showSettings && <DeviceSettings initialSettings={thresholds} onSettingsChange={setThresholds} />}
        <LogsHistory isConnected={isConnected} logs={dataLogs} />
      </main>
    </div>
  );
}