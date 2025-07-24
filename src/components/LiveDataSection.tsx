import React, { useEffect, useState } from 'react';
import { Heart, Wind, Thermometer, Activity, Battery, BatteryMedium, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface LiveDataProps {
  data: {
    heartRate: number | null;
    airQuality: number | null;
    usageCount: number | null;
    connectionStatus: string;
    inhalerBattery: number | null;
    wearableBattery: number | null;
  };
}

// Move helper functions outside component to avoid scope issues
const calculateTrend = (data: Array<{value: number}>) => {
  if (data.length < 3) return 'stable';
  const recent = data.slice(-3).map(d => d.value);
  const avg = recent.reduce((a, b) => a + b) / recent.length;
  const lastValue = recent[recent.length - 1];
  
  if (lastValue > avg * 1.15) return 'increasing';
  if (lastValue < avg * 0.85) return 'decreasing';
  return 'stable';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return <TrendingUp size={12} className="ml-1 text-red-500" />;
    case 'decreasing':
      return <TrendingDown size={12} className="ml-1 text-blue-500" />;
    default:
      return <Minus size={12} className="ml-1 text-gray-400" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return 'text-red-600';
    case 'decreasing':
      return 'text-blue-600';
    default:
      return 'text-gray-500';
  }
};

export const LiveDataSection = ({ data }: LiveDataProps) => {
  // State for historical chart data
  const [heartRateHistory, setHeartRateHistory] = useState<Array<{
    value: number;
  }>>([]);
  const [airQualityHistory, setAirQualityHistory] = useState<Array<{
    value: number;
  }>>([]);

  // Update heart rate history when value changes
  useEffect(() => {
    if (data.heartRate !== null) {
      setHeartRateHistory(prev => {
        const newHistory = [...prev, { value: data.heartRate! }];
        if (newHistory.length > 10) {
          return newHistory.slice(newHistory.length - 10);
        }
        return newHistory;
      });
    }
  }, [data.heartRate]);

  // Update air quality history when value changes
  useEffect(() => {
    if (data.airQuality !== null) {
      setAirQualityHistory(prev => {
        const newHistory = [...prev, { value: data.airQuality! }];
        if (newHistory.length > 10) {
          return newHistory.slice(newHistory.length - 10);
        }
        return newHistory;
      });
    }
  }, [data.airQuality]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <LiveDataCard 
          title="Heart Rate" 
          value={data.heartRate !== null ? `${Math.round(data.heartRate)} BPM` : 'N/A'} 
          icon={<Heart className="text-red-500" />} 
          chartData={heartRateHistory} 
          chartColor="#ef4444" 
        />
        <LiveDataCard 
          title="Air Quality" 
          value={data.airQuality !== null ? `${Math.round(data.airQuality)}%` : 'N/A'} 
          icon={<Wind className="text-green-500" />} 
          chartData={airQualityHistory} 
          chartColor="#22c55e" 
        />
        <LiveDataCard 
          title="Inhaler Usage" 
          value={data.usageCount !== null ? `${data.usageCount} today` : 'N/A'} 
          icon={<Thermometer className="text-blue-500" />} 
        />
        <LiveDataCard 
          title="Connection Status" 
          value={data.connectionStatus} 
          icon={<Activity className={data.connectionStatus === 'Connected' ? 'text-green-500' : 'text-gray-400'} />} 
        />
      </div>
      
      {/* Battery Status Section */}
      {data.connectionStatus === 'Connected' && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2">
            <Battery className="text-blue-500 mr-2" size={18} />
            <div>
              <span className="text-sm text-gray-500 mr-2">Inhaler Battery:</span>
              <span className="font-medium">
                {data.inhalerBattery !== null ? `${Math.round(data.inhalerBattery)}%` : 'N/A'}
              </span>
              {data.inhalerBattery !== null && (
                <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                  <div 
                    className={`h-2 rounded-full ${data.inhalerBattery > 20 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${data.inhalerBattery}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2">
            <BatteryMedium className="text-blue-500 mr-2" size={18} />
            <div>
              <span className="text-sm text-gray-500 mr-2">Wearable Battery:</span>
              <span className="font-medium">
                {data.wearableBattery !== null ? `${Math.round(data.wearableBattery)}%` : 'N/A'}
              </span>
              {data.wearableBattery !== null && (
                <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                  <div 
                    className={`h-2 rounded-full ${data.wearableBattery > 20 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${data.wearableBattery}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface LiveDataCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  chartData?: Array<{ value: number; }>;
  chartColor?: string;
}

const LiveDataCard = ({ title, value, icon, chartData, chartColor }: LiveDataCardProps) => {
  const trend = chartData ? calculateTrend(chartData) : 'stable';
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      
      {/* Mini chart */}
      {chartData && chartData.length > 0 && (
        <div className="h-16 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartColor || '#8884d8'} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={true} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Trend indicator */}
      {chartData && chartData.length > 0 && (
        <div className={`flex items-center text-xs mt-1 ${getTrendColor(trend)}`}>
          <span>Trend: {trend}</span>
          {getTrendIcon(trend)}
        </div>
      )}
    </div>
  );
};