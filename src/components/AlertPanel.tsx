import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
interface AlertPanelProps {
  status: 'normal' | 'warning' | 'critical';
  thresholds: {
    heartRateThreshold: number;
    airQualityThreshold: number;
  };
  liveData: {
    heartRate: number | null;
    airQuality: number | null;
    usageCount: number | null;
  };
}
export const AlertPanel = ({
  status,
  thresholds,
  liveData
}: AlertPanelProps) => {
  const getAlertContent = () => {
    switch (status) {
      case 'normal':
        return {
          icon: <CheckCircle className="text-green-500" size={24} />,
          title: 'All Systems Normal',
          description: 'Your respiratory metrics are within normal ranges.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-amber-500" size={24} />,
          title: 'Warning: Device Disconnected',
          description: 'Please connect your RespiraMate device to view live data.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700'
        };
      case 'critical':
        return {
          icon: <AlertCircle className="text-red-500" size={24} />,
          title: 'Critical Alert',
          description: 'Abnormal respiratory patterns detected. Please check your condition.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700'
        };
      default:
        return {
          icon: <CheckCircle className="text-green-500" size={24} />,
          title: 'Status Unknown',
          description: 'Unable to determine system status.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700'
        };
    }
  };
  const content = getAlertContent();
  // Check for specific threshold alerts
  const hasHeartRateAlert = liveData.heartRate !== null && liveData.heartRate > thresholds.heartRateThreshold;
  const hasAirQualityAlert = liveData.airQuality !== null && liveData.airQuality < thresholds.airQualityThreshold;
  return <div className="mb-6">
      <div className={`rounded-lg border ${content.borderColor} ${content.bgColor} p-4 mb-3`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{content.icon}</div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${content.textColor}`}>
              {content.title}
            </h3>
            <div className={`mt-2 text-sm ${content.textColor}`}>
              <p>{content.description}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Threshold Alerts */}
      {status !== 'warning' && <div className="flex flex-wrap gap-2">
          {hasHeartRateAlert && <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Heart Rate Above Threshold ({thresholds.heartRateThreshold} BPM)
            </div>}
          {hasAirQualityAlert && <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Air Quality Below Threshold ({thresholds.airQualityThreshold}%)
            </div>}
          {!hasHeartRateAlert && !hasAirQualityAlert && status === 'normal' && <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <CheckCircle size={14} className="mr-1" />
              All metrics within healthy thresholds
            </div>}
        </div>}
    </div>;
};