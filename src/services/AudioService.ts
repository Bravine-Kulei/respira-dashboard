/**
 * Audio Service for Emergency Alerts
 * Handles alarm sounds and audio notifications
 */

export class AudioService {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;

  constructor() {
    // Initialize Web Audio API
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Create an emergency alarm tone
   */
  private createAlarmTone(frequency = 800, duration = 0.5): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Set frequency and waveform
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square'; // Square wave for more urgent sound
    
    // Create envelope (attack, sustain, release)
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05); // Attack
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + duration - 0.1); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration); // Release
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Create a two-tone emergency siren
   */
  private createSirenTone(): void {
    if (!this.audioContext) return;

    // High tone
    this.createAlarmTone(800, 0.4);
    
    // Low tone (delayed)
    setTimeout(() => {
      this.createAlarmTone(600, 0.4);
    }, 200);
  }

  /**
   * Start emergency alarm
   */
  public startEmergencyAlarm(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    
    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Play initial alarm
    this.createSirenTone();

    // Set up repeating alarm
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) {
        this.createSirenTone();
      }
    }, 1000); // Repeat every second
  }

  /**
   * Stop emergency alarm
   */
  public stopEmergencyAlarm(): void {
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Play a single notification beep
   */
  public playNotificationBeep(): void {
    this.createAlarmTone(1000, 0.2);
  }

  /**
   * Play a success sound
   */
  public playSuccessSound(): void {
    if (!this.audioContext) return;

    // Play ascending tones
    setTimeout(() => this.createAlarmTone(523, 0.2), 0);   // C5
    setTimeout(() => this.createAlarmTone(659, 0.2), 100); // E5
    setTimeout(() => this.createAlarmTone(784, 0.3), 200); // G5
  }

  /**
   * Play a warning sound
   */
  public playWarningSound(): void {
    // Three short beeps
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.createAlarmTone(700, 0.15), i * 200);
    }
  }

  /**
   * Check if alarm is currently playing
   */
  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stopEmergencyAlarm();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
