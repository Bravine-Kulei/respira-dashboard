/**
 * AI Health Prediction Engine
 * Advanced predictive analytics for respiratory health monitoring
 * Analyzes patterns to predict health events before they occur
 */

export interface HealthData {
  timestamp: number;
  heartRate: number;
  airQuality: number;
  usageCount: number;
  accelerometerData?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface HealthPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  prediction: string;
  confidence: number;
  timeframe: string;
  recommendations: string[];
  triggers: string[];
  riskScore: number;
  nextUpdate: number; // Timestamp for next prediction update
}

export interface PatternAnalysis {
  breathingPattern: {
    trend: 'stable' | 'improving' | 'declining';
    variability: number;
    risk: 'low' | 'medium' | 'high';
  };
  environmentalRisk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  timeBasedRisk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  stressIndicators: {
    level: 'low' | 'medium' | 'high';
    indicators: string[];
  };
}

export class AIHealthPredictor {
  private historicalData: HealthData[] = [];
  private modelAccuracy = { correct: 0, incorrect: 0, total: 0 };
  private algorithmWeights = {
    breathing: 0.4,
    environmental: 0.3,
    temporal: 0.2,
    stress: 0.1
  };

  /**
   * Add new health data point for analysis
   */
  public addDataPoint(data: HealthData): void {
    this.historicalData.push(data);
    
    // Keep only last 100 data points for performance
    if (this.historicalData.length > 100) {
      this.historicalData = this.historicalData.slice(-100);
    }
  }

  /**
   * Generate AI health prediction based on current and historical data
   */
  public generatePrediction(currentData: HealthData): HealthPrediction {
    if (this.historicalData.length < 5) {
      return this.getInitialPrediction();
    }

    const analysis = this.analyzeHealthPatterns(currentData);
    const riskScore = this.calculateRiskScore(analysis);
    const riskLevel = this.determineRiskLevel(riskScore);
    
    return {
      riskLevel,
      prediction: this.generatePredictionText(riskLevel, analysis),
      confidence: this.calculateConfidence(riskScore, analysis),
      timeframe: this.determineTimeframe(riskLevel),
      recommendations: this.generateRecommendations(riskLevel, analysis),
      triggers: this.extractTriggers(analysis),
      riskScore,
      nextUpdate: Date.now() + (5 * 60 * 1000) // Next update in 5 minutes
    };
  }

  /**
   * Analyze health patterns from historical and current data
   */
  private analyzeHealthPatterns(currentData: HealthData): PatternAnalysis {
    return {
      breathingPattern: this.analyzeBreathingPattern(currentData),
      environmentalRisk: this.assessEnvironmentalRisk(currentData),
      timeBasedRisk: this.analyzeTimeBasedRisk(),
      stressIndicators: this.detectStressIndicators(currentData)
    };
  }

  /**
   * Analyze breathing patterns through heart rate variability
   */
  private analyzeBreathingPattern(currentData: HealthData): PatternAnalysis['breathingPattern'] {
    const recentData = this.historicalData.slice(-10);
    const heartRates = recentData.map(d => d.heartRate);
    
    if (heartRates.length < 3) {
      return { trend: 'stable', variability: 0, risk: 'low' };
    }

    const variability = this.calculateVariability(heartRates);
    const trend = this.calculateTrend(heartRates);
    
    let risk: 'low' | 'medium' | 'high' = 'low';
    let trendDirection: 'stable' | 'improving' | 'declining' = 'stable';

    // High variability indicates irregular breathing
    if (variability > 15) {
      risk = 'high';
      trendDirection = 'declining';
    } else if (variability > 8) {
      risk = 'medium';
    }

    // Rapid heart rate increase
    if (trend > 10) {
      risk = Math.max(risk === 'low' ? 1 : risk === 'medium' ? 2 : 3, 2) === 2 ? 'medium' : 'high';
      trendDirection = 'declining';
    } else if (trend < -5) {
      trendDirection = 'improving';
    }

    return { trend: trendDirection, variability, risk };
  }

  /**
   * Assess environmental risk factors
   */
  private assessEnvironmentalRisk(currentData: HealthData): PatternAnalysis['environmentalRisk'] {
    const factors: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Air quality assessment
    if (currentData.airQuality < 60) {
      level = 'high';
      factors.push('Poor air quality detected');
    } else if (currentData.airQuality < 75) {
      level = 'medium';
      factors.push('Moderate air quality');
    }

    // Check for rapid air quality decline
    const recentAirQuality = this.historicalData.slice(-5).map(d => d.airQuality);
    if (recentAirQuality.length >= 3) {
      const decline = recentAirQuality[0] - recentAirQuality[recentAirQuality.length - 1];
      if (decline > 15) {
        level = level === 'low' ? 'medium' : 'high';
        factors.push('Rapid air quality decline');
      }
    }

    return { level, factors };
  }

  /**
   * Analyze time-based risk patterns
   */
  private analyzeTimeBasedRisk(): PatternAnalysis['timeBasedRisk'] {
    const hour = new Date().getHours();
    const factors: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Night-time risk (asthma attacks more common at night)
    if (hour >= 22 || hour <= 6) {
      level = 'medium';
      factors.push('Nighttime increased risk period');
    }

    // Early morning risk
    if (hour >= 4 && hour <= 8) {
      level = 'medium';
      factors.push('Early morning risk period');
    }

    // Check for historical patterns at this time
    const sameTimeData = this.historicalData.filter(d => {
      const dataHour = new Date(d.timestamp).getHours();
      return Math.abs(dataHour - hour) <= 1;
    });

    if (sameTimeData.length >= 3) {
      const avgHeartRate = sameTimeData.reduce((sum, d) => sum + d.heartRate, 0) / sameTimeData.length;
      if (avgHeartRate > 90) {
        level = level === 'low' ? 'medium' : 'high';
        factors.push('Historical elevated readings at this time');
      }
    }

    return { level, factors };
  }

  /**
   * Detect stress indicators from data patterns
   */
  private detectStressIndicators(currentData: HealthData): PatternAnalysis['stressIndicators'] {
    const indicators: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Elevated heart rate
    if (currentData.heartRate > 100) {
      level = 'high';
      indicators.push('Elevated heart rate detected');
    } else if (currentData.heartRate > 85) {
      level = 'medium';
      indicators.push('Moderately elevated heart rate');
    }

    // Increased inhaler usage
    const recentUsage = this.historicalData.slice(-5);
    if (recentUsage.length >= 3) {
      const usageIncrease = recentUsage.slice(-2).reduce((sum, d) => sum + d.usageCount, 0) - 
                           recentUsage.slice(0, 2).reduce((sum, d) => sum + d.usageCount, 0);
      
      if (usageIncrease >= 2) {
        level = level === 'low' ? 'medium' : 'high';
        indicators.push('Increased inhaler usage pattern');
      }
    }

    // Movement patterns (from accelerometer)
    if (currentData.accelerometerData) {
      const totalAcceleration = Math.sqrt(
        Math.pow(currentData.accelerometerData.x, 2) +
        Math.pow(currentData.accelerometerData.y, 2) +
        Math.pow(currentData.accelerometerData.z, 2)
      );

      if (totalAcceleration > 12) {
        level = level === 'low' ? 'medium' : 'high';
        indicators.push('High activity/stress movement detected');
      }
    }

    return { level, indicators };
  }

  /**
   * Calculate overall risk score from pattern analysis
   */
  private calculateRiskScore(analysis: PatternAnalysis): number {
    const scores = {
      breathing: this.getRiskValue(analysis.breathingPattern.risk),
      environmental: this.getRiskValue(analysis.environmentalRisk.level),
      temporal: this.getRiskValue(analysis.timeBasedRisk.level),
      stress: this.getRiskValue(analysis.stressIndicators.level)
    };

    return (
      scores.breathing * this.algorithmWeights.breathing +
      scores.environmental * this.algorithmWeights.environmental +
      scores.temporal * this.algorithmWeights.temporal +
      scores.stress * this.algorithmWeights.stress
    ) * 100;
  }

  /**
   * Convert risk level to numeric value
   */
  private getRiskValue(risk: 'low' | 'medium' | 'high'): number {
    switch (risk) {
      case 'low': return 0.2;
      case 'medium': return 0.6;
      case 'high': return 1.0;
      default: return 0.2;
    }
  }

  /**
   * Determine overall risk level from score
   */
  private determineRiskLevel(score: number): HealthPrediction['riskLevel'] {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable prediction text
   */
  private generatePredictionText(riskLevel: HealthPrediction['riskLevel'], analysis: PatternAnalysis): string {
    switch (riskLevel) {
      case 'critical':
        return 'High probability of respiratory distress within the next hour. Immediate preventive action recommended.';
      case 'high':
        return 'Elevated risk of breathing difficulties detected. Consider using preventive inhaler and avoiding triggers.';
      case 'medium':
        return 'Moderate risk factors present. Monitor symptoms closely and keep inhaler accessible.';
      case 'low':
      default:
        return 'Respiratory patterns appear stable. Continue current activities with normal precautions.';
    }
  }

  /**
   * Calculate prediction confidence based on data quality and patterns
   */
  private calculateConfidence(riskScore: number, analysis: PatternAnalysis): number {
    let confidence = 70; // Base confidence

    // More data points increase confidence
    confidence += Math.min(this.historicalData.length * 2, 20);

    // Clear patterns increase confidence
    if (analysis.breathingPattern.variability > 10) confidence += 5;
    if (analysis.environmentalRisk.factors.length > 0) confidence += 5;

    // Model accuracy affects confidence
    if (this.modelAccuracy.total > 10) {
      const accuracy = this.modelAccuracy.correct / this.modelAccuracy.total;
      confidence += (accuracy - 0.5) * 20;
    }

    return Math.min(Math.max(confidence, 60), 95);
  }

  /**
   * Determine prediction timeframe
   */
  private determineTimeframe(riskLevel: HealthPrediction['riskLevel']): string {
    switch (riskLevel) {
      case 'critical': return 'Next 30-60 minutes';
      case 'high': return 'Next 1-2 hours';
      case 'medium': return 'Next 2-4 hours';
      case 'low':
      default: return 'Next 4-6 hours';
    }
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(riskLevel: HealthPrediction['riskLevel'], analysis: PatternAnalysis): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'critical':
        recommendations.push('Use rescue inhaler immediately if symptoms present');
        recommendations.push('Contact healthcare provider or emergency services');
        recommendations.push('Move to clean air environment');
        recommendations.push('Practice slow, controlled breathing');
        break;

      case 'high':
        recommendations.push('Consider preventive inhaler use');
        recommendations.push('Avoid outdoor activities and known triggers');
        recommendations.push('Stay in air-conditioned environment if possible');
        recommendations.push('Keep rescue inhaler within immediate reach');
        break;

      case 'medium':
        recommendations.push('Monitor symptoms closely');
        recommendations.push('Keep inhaler easily accessible');
        recommendations.push('Avoid strenuous activities');
        if (analysis.environmentalRisk.level !== 'low') {
          recommendations.push('Consider staying indoors due to air quality');
        }
        break;

      case 'low':
      default:
        recommendations.push('Continue normal activities');
        recommendations.push('Maintain regular inhaler schedule');
        recommendations.push('Stay hydrated and practice good breathing habits');
        break;
    }

    // Add specific recommendations based on triggers
    if (analysis.environmentalRisk.factors.length > 0) {
      recommendations.push('Close windows and use air purifier if available');
    }

    if (analysis.stressIndicators.level !== 'low') {
      recommendations.push('Practice relaxation techniques to reduce stress');
    }

    return recommendations;
  }

  /**
   * Extract trigger factors from analysis
   */
  private extractTriggers(analysis: PatternAnalysis): string[] {
    const triggers: string[] = [];

    if (analysis.breathingPattern.risk !== 'low') {
      triggers.push('irregular_breathing');
    }

    if (analysis.environmentalRisk.level !== 'low') {
      triggers.push('environmental_factors');
    }

    if (analysis.timeBasedRisk.level !== 'low') {
      triggers.push('time_based_risk');
    }

    if (analysis.stressIndicators.level !== 'low') {
      triggers.push('stress_indicators');
    }

    return triggers;
  }

  /**
   * Calculate statistical variability
   */
  private calculateVariability(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  /**
   * Get initial prediction for insufficient data
   */
  private getInitialPrediction(): HealthPrediction {
    return {
      riskLevel: 'low',
      prediction: 'Collecting baseline data. AI predictions will improve with more data points.',
      confidence: 60,
      timeframe: 'Next 2-4 hours',
      recommendations: [
        'Continue normal monitoring',
        'Keep inhaler accessible',
        'Allow system to collect more data for better predictions'
      ],
      triggers: [],
      riskScore: 20,
      nextUpdate: Date.now() + (2 * 60 * 1000)
    };
  }

  /**
   * Update model accuracy based on feedback
   */
  public updateModelAccuracy(predicted: boolean, actual: boolean): void {
    this.modelAccuracy.total++;
    if (predicted === actual) {
      this.modelAccuracy.correct++;
    } else {
      this.modelAccuracy.incorrect++;
    }

    // Adjust algorithm weights based on accuracy
    this.adjustAlgorithmWeights();
  }

  /**
   * Adjust algorithm weights based on performance
   */
  private adjustAlgorithmWeights(): void {
    if (this.modelAccuracy.total < 10) return;

    const accuracy = this.modelAccuracy.correct / this.modelAccuracy.total;
    
    // If accuracy is low, adjust weights slightly
    if (accuracy < 0.7) {
      // Increase weight on breathing patterns (most reliable indicator)
      this.algorithmWeights.breathing = Math.min(0.5, this.algorithmWeights.breathing + 0.05);
      this.algorithmWeights.environmental = Math.max(0.2, this.algorithmWeights.environmental - 0.02);
    }
  }

  /**
   * Get model performance statistics
   */
  public getModelStats(): { accuracy: number; totalPredictions: number; confidence: number } {
    const accuracy = this.modelAccuracy.total > 0 ? 
      this.modelAccuracy.correct / this.modelAccuracy.total : 0;
    
    return {
      accuracy: Math.round(accuracy * 100),
      totalPredictions: this.modelAccuracy.total,
      confidence: Math.round(accuracy * 100)
    };
  }
}

// Singleton instance
export const aiHealthPredictor = new AIHealthPredictor();
