import React, { useState } from 'react';
import { Settings, Save, Moon, Sun, Plus, Trash2, Phone, Mail, User, Volume2, Brain, Activity } from 'lucide-react';
import { audioService } from '../services/AudioService';
import { aiHealthPredictor } from '../services/AIHealthPredictor';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: 'high' | 'medium' | 'low';
}

interface DeviceSettingsProps {
  initialSettings: {
    heartRateThreshold: number;
    airQualityThreshold: number;
    notificationsEnabled: boolean;
  };
  onSettingsChange: (settings: {
    heartRateThreshold: number;
    airQualityThreshold: number;
    notificationsEnabled: boolean;
  }) => void;
  emergencyContacts?: EmergencyContact[];
  onEmergencyContactsChange?: (contacts: EmergencyContact[]) => void;
}
export const DeviceSettings = ({
  initialSettings,
  onSettingsChange,
  emergencyContacts = [],
  onEmergencyContactsChange
}: DeviceSettingsProps) => {
  const [settings, setSettings] = useState({
    ...initialSettings,
    darkMode: false,
    vibrationAlerts: true,
    soundAlerts: false,
    autoSync: true
  });

  const [contacts, setContacts] = useState<EmergencyContact[]>(emergencyContacts);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    priority: 'medium'
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    const newSettings = {
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    };
    setSettings(newSettings);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update parent component with threshold settings
    onSettingsChange({
      heartRateThreshold: Number(settings.heartRateThreshold),
      airQualityThreshold: Number(settings.airQualityThreshold),
      notificationsEnabled: settings.notificationsEnabled
    });
    // Update emergency contacts
    if (onEmergencyContactsChange) {
      onEmergencyContactsChange(contacts);
    }
    // In a real app, this would save settings to the device
    console.log('Settings saved:', settings);
    console.log('Emergency contacts saved:', contacts);
  };

  const addEmergencyContact = () => {
    if (newContact.name && newContact.phone) {
      const contact: EmergencyContact = {
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email || '',
        relationship: newContact.relationship || '',
        priority: newContact.priority || 'medium'
      };
      setContacts([...contacts, contact]);
      setNewContact({
        name: '',
        phone: '',
        email: '',
        relationship: '',
        priority: 'medium'
      });
      setShowAddContact(false);
    }
  };

  const removeEmergencyContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const handleContactChange = (field: keyof EmergencyContact, value: string) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center mb-4">
        <Settings size={20} className="text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">Device Settings</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="heartRateThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Heart Rate Alert Threshold (BPM)
            </label>
            <input type="number" id="heartRateThreshold" name="heartRateThreshold" value={settings.heartRateThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="airQualityThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Air Quality Alert Threshold (%)
            </label>
            <input type="number" id="airQualityThreshold" name="airQualityThreshold" value={settings.airQualityThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Notification Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <input type="checkbox" id="notificationsEnabled" name="notificationsEnabled" checked={settings.notificationsEnabled} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="notificationsEnabled" className="ml-2 block text-sm text-gray-700">
                Enable Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="vibrationAlerts" name="vibrationAlerts" checked={settings.vibrationAlerts} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="vibrationAlerts" className="ml-2 block text-sm text-gray-700">
                Vibration Alerts
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="soundAlerts" name="soundAlerts" checked={settings.soundAlerts} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="soundAlerts" className="ml-2 block text-sm text-gray-700">
                Sound Alerts
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="autoSync" name="autoSync" checked={settings.autoSync} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="autoSync" className="ml-2 block text-sm text-gray-700">
                Auto-sync Data
              </label>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Display Settings
          </h3>
          <div className="flex items-center">
            <button type="button" className={`flex items-center px-3 py-1.5 rounded-l-md ${!settings.darkMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`} onClick={() => setSettings({
            ...settings,
            darkMode: false
          })}>
              <Sun size={16} className="mr-1" />
              Light
            </button>
            <button type="button" className={`flex items-center px-3 py-1.5 rounded-r-md ${settings.darkMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`} onClick={() => setSettings({
            ...settings,
            darkMode: true
          })}>
              <Moon size={16} className="mr-1" />
              Dark
            </button>
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <div className="mb-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <User size={16} className="mr-2" />
              Emergency Contacts
            </h3>
            <button
              type="button"
              onClick={() => setShowAddContact(!showAddContact)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus size={14} className="mr-1" />
              Add Contact
            </button>
          </div>

          {/* Existing Contacts */}
          <div className="space-y-3 mb-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.relationship}</p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Phone size={12} />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Mail size={12} />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contact.priority === 'high' ? 'bg-red-100 text-red-800' :
                      contact.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {contact.priority}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeEmergencyContact(contact.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No emergency contacts configured. Add contacts to receive alerts during emergencies.
              </p>
            )}
          </div>

          {/* Add New Contact Form */}
          {showAddContact && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Add Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newContact.name || ''}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContact.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newContact.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={newContact.relationship || ''}
                  onChange={(e) => handleContactChange('relationship', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <select
                  value={newContact.priority || 'medium'}
                  onChange={(e) => handleContactChange('priority', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addEmergencyContact}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI System Testing */}
        <div className="mb-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Brain size={16} className="mr-2" />
            AI Health Prediction System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <button
              type="button"
              onClick={() => {
                const stats = aiHealthPredictor.getModelStats();
                alert(`AI Model Statistics:\nAccuracy: ${stats.accuracy}%\nTotal Predictions: ${stats.totalPredictions}\nConfidence: ${stats.confidence}%`);
              }}
              className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <Activity size={14} className="mr-2" />
              View AI Model Stats
            </button>
            <button
              type="button"
              onClick={() => {
                // Simulate high-risk scenario for testing
                const testData = {
                  timestamp: Date.now(),
                  heartRate: 120, // High heart rate
                  airQuality: 45, // Poor air quality
                  usageCount: 3,  // Increased usage
                  accelerometerData: { x: 2, y: 1, z: 8 }
                };
                aiHealthPredictor.addDataPoint(testData);
                const prediction = aiHealthPredictor.generatePrediction(testData);
                audioService.speakText(`AI test prediction: ${prediction.prediction.split('.')[0]}`);
              }}
              className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
            >
              <Brain size={14} className="mr-2" />
              Test High-Risk Scenario
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            The AI system continuously analyzes your health patterns to predict potential issues before they become emergencies. Test the system to ensure it's working properly.
          </p>
        </div>

        {/* Voice Announcement Testing */}
        <div className="mb-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Volume2 size={16} className="mr-2" />
            Voice Announcements
          </h3>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => audioService.playConnectionAnnouncement()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Volume2 size={14} className="mr-2" />
              Test "Respira here, Active"
            </button>
            <button
              type="button"
              onClick={() => audioService.speakText("Emergency alert activated. Please check your condition immediately.")}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Volume2 size={14} className="mr-2" />
              Test Emergency Voice
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Test voice announcements to ensure audio is working properly. The system will automatically announce "Respira here, Active" 10 seconds after connecting.
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Save size={16} className="mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </div>;
};