/**
 * IoT Data Display Component
 * Real-time display of data from connected IoT devices
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Wind, 
  Thermometer, 
  Battery, 
  Activity, 
  Wifi, 
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { useDeviceData } from '../hooks/useIoTConnection';
import { DeviceData } from '../services/iot/IoTManager';

interface IoTDataDisplayProps {
  deviceId?: string;
  showCharts?: boolean;
  refreshInterval?: number;
  className?: string;
}

interface DataPoint {
  timestamp: number;
  value: number;
}

export const IoTDataDisplay: React.FC<IoTDataDisplayProps> = ({
  deviceId,
  showCharts = true,
  refreshInterval = 1000,
  className = ''
}) => {
  const { data, isConnected, connectionQuality, timestamp } = useDeviceData(deviceId);
  
  // Historical data for charts
  const [heartRateHistory, setHeartRateHistory] = useState<DataPoint[]>([]);
  const [airQualityHistory, setAirQualityHistory] = useState<DataPoint[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  /**
   * Update historical data when new data arrives
   */
  useEffect(() => {
    if (data && timestamp) {
      const now = Date.now();
      
      // Update heart rate history
      if (data.heartRate !== undefined) {
        setHeartRateHistory(prev => {
          const newHistory = [...prev, { timestamp: now, value: data.heartRate! }];
          return newHistory.slice(-20); // Keep last 20 points
        });
      }
      
      // Update air quality history
      if (data.airQuality !== undefined) {
        setAirQualityHistory(prev => {
          const newHistory = [...prev, { timestamp: now, value: data.airQuality! }];
          return newHistory.slice(-20); // Keep last 20 points
        });
      }
      
      setLastUpdateTime(new Date(timestamp));
    }
  }, [data, timestamp]);

  /**
   * Get trend indicator for a metric
   */
  const getTrendIndicator = (current: number, history: DataPoint[]) => {
    if (history.length < 2) return <Minus size={16} className="text-gray-400" />;
    
    const previous = history[history.length - 2]?.value;
    const diff = current - previous;
    
    if (Math.abs(diff) < 1) {
      return <Minus size={16} className="text-gray-400" />;
    }
    
    return diff > 0 
      ? <TrendingUp size={16} className="text-green-500" />
      : <TrendingDown size={16} className="text-red-500" />;
  };

  /**
   * Get connection status indicator
   */
  const getConnectionIndicator = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <WifiOff size={16} />
          <span className="text-sm">Disconnected</span>
        </div>
      );
    }

    const qualityColors = {
      excellent: 'text-green-500',
      good: 'text-yellow-500',
      poor: 'text-red-500',
      disconnected: 'text-gray-500'
    };

    return (
      <div className={`flex items-center gap-2 ${qualityColors[connectionQuality]}`}>
        <Wifi size={16} />
        <span className="text-sm capitalize">{connectionQuality}</span>
      </div>
    );
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  /**
   * Get battery level color
   */
  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  /**
   * Data card component
   */
  const DataCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: React.ReactNode;
    chart?: DataPoint[];
    color?: string;
    alert?: boolean;
  }> = ({ title, value, icon, trend, chart, color = '#3b82f6', alert = false }) => (
    <div className={`bg-white rounded-lg border-2 p-4 ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        {trend}
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {value}
      </div>
      
      {showCharts && chart && chart.length > 1 && (
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
              />
              <YAxis hide />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                formatter={(value: number) => [value.toFixed(1), title]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {alert && (
        <div className="flex items-center gap-1 mt-2 text-red-600">
          <AlertTriangle size={14} />
          <span className="text-xs">Alert threshold exceeded</span>
        </div>
      )}
    </div>
  );

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <WifiOff size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Device Connected</h3>
          <p className="text-gray-600">Connect a device to view real-time data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Live Device Data</h2>
          {lastUpdateTime && (
            <p className="text-sm text-gray-600">
              Last updated: {formatTimestamp(lastUpdateTime)}
            </p>
          )}
        </div>
        {getConnectionIndicator()}
      </div>

      {/* Data Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Heart Rate */}
        {data?.heartRate !== undefined && (
          <DataCard
            title="Heart Rate"
            value={`${Math.round(data.heartRate)} BPM`}
            icon={<Heart className="text-red-500" size={20} />}
            trend={getTrendIndicator(data.heartRate, heartRateHistory)}
            chart={heartRateHistory}
            color="#ef4444"
            alert={data.heartRate > 100}
          />
        )}

        {/* Air Quality */}
        {data?.airQuality !== undefined && (
          <DataCard
            title="Air Quality"
            value={`${Math.round(data.airQuality)}%`}
            icon={<Wind className="text-green-500" size={20} />}
            trend={getTrendIndicator(data.airQuality, airQualityHistory)}
            chart={airQualityHistory}
            color="#22c55e"
            alert={data.airQuality < 70}
          />
        )}

        {/* Inhaler Usage */}
        {data?.inhalerUsage !== undefined && (
          <DataCard
            title="Inhaler Usage"
            value={`${data.inhalerUsage} today`}
            icon={<Thermometer className="text-blue-500" size={20} />}
          />
        )}

        {/* Battery Levels */}
        {(data?.inhalerBattery !== undefined || data?.wearableBattery !== undefined) && (
          <DataCard
            title="Battery Levels"
            value={
              data?.inhalerBattery !== undefined 
                ? `${Math.round(data.inhalerBattery)}%`
                : data?.wearableBattery !== undefined 
                  ? `${Math.round(data.wearableBattery)}%`
                  : 'N/A'
            }
            icon={
              <Battery 
                className={getBatteryColor(data?.inhalerBattery || data?.wearableBattery || 0)} 
                size={20} 
              />
            }
            alert={(data?.inhalerBattery || data?.wearableBattery || 100) < 20}
          />
        )}
      </div>

      {/* Detailed Battery Information */}
      {(data?.inhalerBattery !== undefined && data?.wearableBattery !== undefined) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Device Battery Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Inhaler Device</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      data.inhalerBattery > 60 ? 'bg-green-500' :
                      data.inhalerBattery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.inhalerBattery}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getBatteryColor(data.inhalerBattery)}`}>
                  {Math.round(data.inhalerBattery)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Wearable Device</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      data.wearableBattery > 60 ? 'bg-green-500' :
                      data.wearableBattery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.wearableBattery}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getBatteryColor(data.wearableBattery)}`}>
                  {Math.round(data.wearableBattery)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Data Quality: {connectionQuality}</span>
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span>Real-time updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
