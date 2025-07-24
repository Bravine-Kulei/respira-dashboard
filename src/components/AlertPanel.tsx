import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Phone, Mail, Volume2, VolumeX, UserX } from 'lucide-react';
import { audioService } from '../services/AudioService';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: 'high' | 'medium' | 'low';
}

interface AlertPanelProps {
  status: 'normal' | 'warning' | 'critical' | 'emergency';
  thresholds: {
    heartRateThreshold: number;
    airQualityThreshold: number;
  };
  liveData: {
    heartRate: number | null;
    airQuality: number | null;
    usageCount: number | null;
    fallDetected?: boolean;
    accelerometerData?: {
      x: number;
      y: number;
      z: number;
    };
  };
  emergencyContacts?: EmergencyContact[];
  onEmergencyAlert?: (alertType: string, data: {
    timestamp: string;
    heartRate: number | null;
    airQuality: number | null;
    fallDetected?: boolean;
    accelerometerData?: { x: number; y: number; z: number };
    location: string;
  }) => void;
}
export const AlertPanel = ({
  status,
  thresholds,
  liveData,
  emergencyContacts = [],
  onEmergencyAlert
}: AlertPanelProps) => {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);

  // Handle emergency alarm audio
  useEffect(() => {
    if (status === 'emergency' && !isAlarmPlaying) {
      setIsAlarmPlaying(true);
      audioService.startEmergencyAlarm();
    } else if (status !== 'emergency' && isAlarmPlaying) {
      setIsAlarmPlaying(false);
      audioService.stopEmergencyAlarm();
    }

    return () => {
      // Cleanup on unmount
      if (isAlarmPlaying) {
        audioService.stopEmergencyAlarm();
      }
    };
  }, [status, isAlarmPlaying]);
  // Emergency alert system
  useEffect(() => {
    if (status === 'emergency' && !emergencyAlertSent) {
      handleEmergencyAlert();
      setEmergencyAlertSent(true);
      setLastAlertTime(new Date());
    } else if (status !== 'emergency') {
      setEmergencyAlertSent(false);
      setIsAlarmPlaying(false);
    }
  }, [status, emergencyAlertSent]);

  const handleEmergencyAlert = async () => {
    const alertData = {
      timestamp: new Date().toISOString(),
      heartRate: liveData.heartRate,
      airQuality: liveData.airQuality,
      fallDetected: liveData.fallDetected,
      accelerometerData: liveData.accelerometerData,
      location: 'Unknown', // Could be enhanced with geolocation
    };

    // Voice announcement for emergency
    const emergencyMessage = liveData.fallDetected
      ? "Emergency alert! Fall detected. Emergency contacts have been notified."
      : "Emergency alert! Critical health condition detected. Emergency contacts have been notified.";

    // Speak emergency alert after a short delay (let alarm play first)
    setTimeout(() => {
      audioService.speakText(emergencyMessage, {
        rate: 1.1,
        pitch: 1.2,
        volume: 0.9
      });
    }, 2000);

    // Send alerts to emergency contacts
    if (emergencyContacts.length > 0) {
      await sendEmergencyNotifications(alertData);
    }

    // Trigger callback if provided
    if (onEmergencyAlert) {
      onEmergencyAlert('emergency', alertData);
    }
  };

  const sendEmergencyNotifications = async (alertData: {
    timestamp: string;
    heartRate: number | null;
    airQuality: number | null;
    fallDetected?: boolean;
    accelerometerData?: { x: number; y: number; z: number };
    location: string;
  }) => {
    // Sort contacts by priority
    const sortedContacts = [...emergencyContacts].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const contact of sortedContacts) {
      try {
        // Simulate SMS/Email sending (in real app, this would call actual APIs)
        console.log(`Sending emergency alert to ${contact.name} (${contact.phone})`, alertData);

        // In a real implementation, you would use services like:
        // - Twilio for SMS
        // - SendGrid for Email
        // - Push notifications

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to send alert to ${contact.name}:`, error);
      }
    }
  };

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    audioService.stopEmergencyAlarm();
  };

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
      case 'emergency':
        return {
          icon: <AlertCircle className="text-red-600 animate-pulse" size={32} />,
          title: '🚨 EMERGENCY ALERT 🚨',
          description: liveData.fallDetected
            ? 'Fall detected! Emergency contacts have been notified.'
            : 'Critical health emergency detected! Emergency contacts have been notified.',
          bgColor: 'bg-red-100 animate-pulse',
          borderColor: 'border-red-500',
          textColor: 'text-red-800'
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
  const hasFallAlert = liveData.fallDetected === true;

  return (
    <div className="mb-6">
      <div className={`rounded-lg border ${content.borderColor} ${content.bgColor} p-4 mb-3`}>
        <div className="flex items-start justify-between">
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

          {/* Emergency Controls */}
          {status === 'emergency' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={stopAlarm}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 flex items-center"
              >
                {isAlarmPlaying ? <VolumeX size={14} className="mr-1" /> : <Volume2 size={14} className="mr-1" />}
                {isAlarmPlaying ? 'Stop Alarm' : 'Alarm Off'}
              </button>
              <button
                onClick={() => setShowEmergencyDetails(!showEmergencyDetails)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
              >
                Details
              </button>
            </div>
          )}
        </div>

        {/* Emergency Details */}
        {status === 'emergency' && showEmergencyDetails && (
          <div className="mt-4 pt-4 border-t border-red-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Alert Details:</h4>
                <ul className="space-y-1 text-red-700">
                  {hasFallAlert && <li>• Fall detected by accelerometer</li>}
                  {hasHeartRateAlert && <li>• Heart rate: {liveData.heartRate} BPM (&gt;{thresholds.heartRateThreshold})</li>}
                  {hasAirQualityAlert && <li>• Air quality: {liveData.airQuality}% (&lt;{thresholds.airQualityThreshold})</li>}
                  {lastAlertTime && <li>• Alert time: {lastAlertTime.toLocaleTimeString()}</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Emergency Contacts Notified:</h4>
                {emergencyContacts.length > 0 ? (
                  <ul className="space-y-1 text-red-700">
                    {emergencyContacts.slice(0, 3).map(contact => (
                      <li key={contact.id} className="flex items-center">
                        <Phone size={12} className="mr-1" />
                        {contact.name} ({contact.relationship})
                      </li>
                    ))}
                    {emergencyContacts.length > 3 && (
                      <li className="text-red-600">+ {emergencyContacts.length - 3} more contacts</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-red-600 flex items-center">
                    <UserX size={14} className="mr-1" />
                    No emergency contacts configured
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Threshold Alerts */}
      {status !== 'warning' && (
        <div className="flex flex-wrap gap-2">
          {hasFallAlert && (
            <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Fall Detected - Emergency Alert Triggered
            </div>
          )}
          {hasHeartRateAlert && (
            <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Heart Rate Above Threshold ({thresholds.heartRateThreshold} BPM)
            </div>
          )}
          {hasAirQualityAlert && (
            <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Air Quality Below Threshold ({thresholds.airQualityThreshold}%)
            </div>
          )}
          {!hasHeartRateAlert && !hasAirQualityAlert && !hasFallAlert && status === 'normal' && (
            <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
              <CheckCircle size={14} className="mr-1" />
              All metrics within healthy thresholds
            </div>
          )}
        </div>
      )}

      {/* Emergency Contact Quick Actions */}
      {status === 'emergency' && emergencyContacts.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Quick Contact Actions:</h4>
          <div className="flex flex-wrap gap-2">
            {emergencyContacts.slice(0, 2).map(contact => (
              <div key={contact.id} className="flex items-center space-x-1">
                <button
                  onClick={() => window.open(`tel:${contact.phone}`)}
                  className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center"
                >
                  <Phone size={12} className="mr-1" />
                  Call {contact.name}
                </button>
                <button
                  onClick={() => window.open(`mailto:${contact.email}?subject=Emergency Alert&body=Emergency alert triggered at ${new Date().toLocaleString()}`)}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center"
                >
                  <Mail size={12} className="mr-1" />
                  Email
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

