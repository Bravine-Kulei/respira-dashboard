/**
 * AI Prediction Panel Component
 * Displays AI-powered health predictions and recommendations
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  Lightbulb,
  Activity
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { HealthPrediction } from '../services/AIHealthPredictor';

interface AIPredictionPanelProps {
  prediction: HealthPrediction;
  isVisible: boolean;
  onToggleVisibility: () => void;
  predictionHistory?: Array<{ timestamp: number; riskScore: number; riskLevel: string }>;
}

export const AIPredictionPanel: React.FC<AIPredictionPanelProps> = ({
  prediction,
  isVisible,
  onToggleVisibility,
  predictionHistory = []
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animateRisk, setAnimateRisk] = useState(false);

  // Animate risk level changes
  useEffect(() => {
    if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
      setAnimateRisk(true);
      const timer = setTimeout(() => setAnimateRisk(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [prediction.riskLevel]);

  const getRiskLevelConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          badgeColor: 'bg-red-100 text-red-800',
          pulseColor: 'animate-pulse'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-500',
          badgeColor: 'bg-orange-100 text-orange-800',
          pulseColor: animateRisk ? 'animate-pulse' : ''
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          pulseColor: ''
        };
      case 'low':
      default:
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-500',
          badgeColor: 'bg-green-100 text-green-800',
          pulseColor: ''
        };
    }
  };

  const config = getRiskLevelConfig(prediction.riskLevel);

  const getRiskIcon = () => {
    switch (prediction.riskLevel) {
      case 'critical':
      case 'high':
        return <TrendingUp className={config.iconColor} size={24} />;
      case 'medium':
        return <Minus className={config.iconColor} size={24} />;
      case 'low':
      default:
        return <TrendingDown className={config.iconColor} size={24} />;
    }
  };

  const formatTimeframe = (timeframe: string) => {
    return timeframe.replace('Next ', '');
  };

  if (!isVisible) {
    return (
      <div className="mb-4">
        <button
          onClick={onToggleVisibility}
          className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center justify-center space-x-2">
            <Brain className="text-blue-600" size={20} />
            <span className="text-blue-800 font-medium">Show AI Health Predictions</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Main Prediction Panel */}
      <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} ${config.pulseColor} p-4 mb-3`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <Brain className={config.iconColor} size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`font-semibold ${config.textColor} text-lg`}>
                  🤖 AI Health Prediction
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${config.badgeColor} font-medium`}>
                  {prediction.confidence}% confidence
                </span>
                <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
                  Risk: {prediction.riskLevel.toUpperCase()}
                </span>
              </div>
              
              <p className={`${config.textColor} mb-3 leading-relaxed`}>
                {prediction.prediction}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Timeframe */}
                <div className="flex items-center space-x-2">
                  <Clock className={config.iconColor} size={16} />
                  <span className={`text-sm ${config.textColor}`}>
                    <strong>Timeframe:</strong> {formatTimeframe(prediction.timeframe)}
                  </span>
                </div>

                {/* Risk Score */}
                <div className="flex items-center space-x-2">
                  <Target className={config.iconColor} size={16} />
                  <span className={`text-sm ${config.textColor}`}>
                    <strong>Risk Score:</strong> {Math.round(prediction.riskScore)}/100
                  </span>
                </div>
              </div>

              {/* Risk Score Visualization */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={config.textColor}>Risk Level</span>
                  <span className={config.textColor}>{Math.round(prediction.riskScore)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      prediction.riskLevel === 'critical' ? 'bg-red-500' :
                      prediction.riskLevel === 'high' ? 'bg-orange-500' :
                      prediction.riskLevel === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(prediction.riskScore, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`px-3 py-1 text-xs rounded ${config.badgeColor} hover:opacity-80 transition-opacity`}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              onClick={onToggleVisibility}
              className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Minimize
            </button>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-4">
          <h4 className={`text-sm font-semibold ${config.textColor} mb-3 flex items-center`}>
            <Lightbulb className={config.iconColor} size={16} />
            <span className="ml-2">AI Recommendations:</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {prediction.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={14} />
                <span className={`text-sm ${config.textColor}`}>
                  {recommendation}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        {prediction.triggers.length > 0 && (
          <div className="mt-4">
            <h4 className={`text-sm font-semibold ${config.textColor} mb-2 flex items-center`}>
              <AlertTriangle className={config.iconColor} size={16} />
              <span className="ml-2">Detected Risk Factors:</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {prediction.triggers.map((trigger, index) => (
                <span 
                  key={index} 
                  className={`text-xs px-2 py-1 rounded-full ${config.badgeColor}`}
                >
                  {trigger.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className={`text-sm font-semibold ${config.textColor} mb-3 flex items-center`}>
              <Activity className={config.iconColor} size={16} />
              <span className="ml-2">Detailed Analysis:</span>
            </h4>
            
            {/* Prediction History Chart */}
            {predictionHistory.length > 0 && (
              <div className="mb-4">
                <h5 className={`text-xs font-medium ${config.textColor} mb-2`}>
                  Risk Score Trend (Last 24 hours)
                </h5>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictionHistory}>
                      <XAxis 
                        dataKey="timestamp" 
                        hide 
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <Line 
                        type="monotone" 
                        dataKey="riskScore" 
                        stroke={
                          prediction.riskLevel === 'critical' ? '#ef4444' :
                          prediction.riskLevel === 'high' ? '#f59e0b' :
                          prediction.riskLevel === 'medium' ? '#eab308' :
                          '#22c55e'
                        }
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Algorithm Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <h6 className={`font-medium ${config.textColor} mb-1`}>Analysis Factors:</h6>
                <ul className={`space-y-1 ${config.textColor} opacity-80`}>
                  <li>• Breathing pattern analysis</li>
                  <li>• Environmental risk assessment</li>
                  <li>• Time-based risk patterns</li>
                  <li>• Stress indicator detection</li>
                </ul>
              </div>
              <div>
                <h6 className={`font-medium ${config.textColor} mb-1`}>Next Update:</h6>
                <p className={`${config.textColor} opacity-80`}>
                  {new Date(prediction.nextUpdate).toLocaleTimeString()}
                </p>
                <h6 className={`font-medium ${config.textColor} mb-1 mt-2`}>Prediction Model:</h6>
                <p className={`${config.textColor} opacity-80`}>
                  Advanced pattern recognition with continuous learning
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons for High Risk */}
      {(prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') && (
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            📱 Contact Healthcare Provider
          </button>
          <button className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
            💨 Start Breathing Exercise
          </button>
          <button className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
            📊 View Detailed Analysis
          </button>
        </div>
      )}
    </div>
  );
};
