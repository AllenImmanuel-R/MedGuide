/**
 * Simplified Voice Recording Service using Web Speech API
 * 
 * This service provides a reliable speech-to-text solution using
 * the browser's built-in Web Speech API, which is widely supported
 * and doesn't require external model files.
 */

export interface VoiceRecognitionResult {
  text: string;
  confidence?: number;
  isFinal: boolean;
}

export interface VoiceRecordingOptions {
  language?: string;
  continuous?: boolean;
  maxRecordingTime?: number; // in milliseconds
}

export interface VoiceRecordingStatus {
  isRecording: boolean;
  isInitialized: boolean;
  hasPermission: boolean;
  currentText?: string;
  error?: string;
}

export class SimplifiedVoiceService {
  private recognition: SpeechRecognition | null = null;
  private isRecording: boolean = false;
  private isInitialized: boolean = false;
  private currentTranscript: string = '';
  private recordingTimeoutId: NodeJS.Timeout | null = null;
  private hasPermission: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  // Event callbacks
  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onErrorCallback?: (error: Error) => void;
  private onStatusChangeCallback?: (status: VoiceRecordingStatus) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize the speech recognition service
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🎤 Initializing Voice Recording Service...');

      // Check if Speech Recognition is supported
      if (!this.isSpeechRecognitionSupported()) {
        throw new Error('Speech recognition is not supported in this browser');
      }

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configure speech recognition
      this.setupRecognition();

      // Check microphone permission (don't wait for it, just check)
      this.checkMicrophoneAccessAsync();

      this.isInitialized = true;
      console.log('✅ Voice Recording Service initialized successfully');

      // Notify status change
      this.notifyStatusChange();

    } catch (error) {
      console.error('❌ Failed to initialize Voice Recording Service:', error);
      this.onErrorCallback?.(error as Error);
      this.notifyStatusChange();
    }
  }

  /**
   * Ensure the service is initialized before use
   */
  async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Set up speech recognition configuration
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = true; // Keep listening until manually stopped
    this.recognition.interimResults = true; // Get partial results
    this.recognition.maxAlternatives = 1; // Only get the best result
    this.recognition.lang = 'en-US'; // Default language

    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('🎙️ Speech recognition started');
      this.isRecording = true;
      this.currentTranscript = '';
      this.onStartCallback?.();
      this.notifyStatusChange();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update current transcript
      if (finalTranscript) {
        this.currentTranscript += finalTranscript;
        this.onResultCallback?.({
          text: finalTranscript,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 1,
          isFinal: true
        });
      }

      if (interimTranscript) {
        this.onResultCallback?.({
          text: interimTranscript,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.5,
          isFinal: false
        });
      }

      this.notifyStatusChange();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🚫 Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'Unable to capture audio. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please grant microphone permission.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        case 'language-not-supported':
          errorMessage = 'Selected language is not supported.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is not allowed.';
          break;
      }

      this.onErrorCallback?.(new Error(errorMessage));
      this.notifyStatusChange();
    };

    this.recognition.onend = () => {
      console.log('🔴 Speech recognition ended');
      this.isRecording = false;
      this.onEndCallback?.();
      this.notifyStatusChange();
      
      // Clear any recording timeout
      if (this.recordingTimeoutId) {
        clearTimeout(this.recordingTimeoutId);
        this.recordingTimeoutId = null;
      }
    };

    this.recognition.onnomatch = () => {
      console.warn('⚠️ No speech match found');
    };

    this.recognition.onsoundstart = () => {
      console.log('🔊 Sound detected');
    };

    this.recognition.onsoundend = () => {
      console.log('🔇 Sound ended');
    };

    this.recognition.onspeechstart = () => {
      console.log('🗣️ Speech started');
    };

    this.recognition.onspeechend = () => {
      console.log('🤐 Speech ended');
    };
  }

  /**
   * Check if speech recognition is supported
   */
  private isSpeechRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Check microphone access asynchronously (non-blocking)
   */
  private async checkMicrophoneAccessAsync(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      this.hasPermission = true;
      console.log('✅ Microphone access granted');
      this.notifyStatusChange();
    } catch (error) {
      console.log('⚠️ Microphone access not yet granted');
      this.hasPermission = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Check microphone access synchronously
   */
  private async checkMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone access check failed:', error);
      return false;
    }
  }

  /**
   * Start voice recording
   */
  async startRecording(options: VoiceRecordingOptions = {}): Promise<void> {
    // Ensure service is initialized first
    await this.ensureInitialized();

    if (!this.isInitialized) {
      throw new Error('Voice service failed to initialize');
    }

    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    if (this.isRecording) {
      console.warn('⚠️ Already recording');
      return;
    }

    try {
      // Set language if provided
      if (options.language) {
        this.recognition.lang = options.language;
      }

      // Configure continuous recording
      if (options.continuous !== undefined) {
        this.recognition.continuous = options.continuous;
      }

      // Start recognition
      this.recognition.start();

      // Set maximum recording time if specified
      if (options.maxRecordingTime && options.maxRecordingTime > 0) {
        this.recordingTimeoutId = setTimeout(() => {
          if (this.isRecording) {
            console.log('⏰ Recording timeout reached, stopping...');
            this.stopRecording();
          }
        }, options.maxRecordingTime);
      }

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop voice recording
   */
  async stopRecording(): Promise<string> {
    if (!this.isRecording) {
      console.warn('⚠️ Not currently recording');
      return this.currentTranscript;
    }

    try {
      if (this.recognition) {
        this.recognition.stop();
      }

      // Clear timeout if it exists
      if (this.recordingTimeoutId) {
        clearTimeout(this.recordingTimeoutId);
        this.recordingTimeoutId = null;
      }

      console.log('🔴 Voice recording stopped');
      return this.currentTranscript;

    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }

  /**
   * Cancel voice recording
   */
  async cancelRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      // Clear timeout if it exists
      if (this.recordingTimeoutId) {
        clearTimeout(this.recordingTimeoutId);
        this.recordingTimeoutId = null;
      }

      this.isRecording = false;
      this.currentTranscript = '';
      
      console.log('🚫 Voice recording cancelled');
      this.notifyStatusChange();

    } catch (error) {
      console.error('❌ Error cancelling recording:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  /**
   * Set language for speech recognition
   */
  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
      console.log(`🌍 Language set to: ${language}`);
    }
  }

  /**
   * Get supported languages (basic implementation)
   */
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'ta-IN', 'ta-LK', 'ta-SG',
      'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
      'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN'
    ];
  }

  /**
   * Get current recording status
   */
  getStatus(): VoiceRecordingStatus {
    return {
      isRecording: this.isRecording,
      isInitialized: this.isInitialized,
      hasPermission: this.hasPermission,
      currentText: this.currentTranscript
    };
  }

  /**
   * Notify status change to listeners
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.onStatusChangeCallback?.(status);
  }

  /**
   * Event handler setters
   */
  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  onStatusChange(callback: (status: VoiceRecordingStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.isRecording) {
      this.cancelRecording();
    }

    if (this.recordingTimeoutId) {
      clearTimeout(this.recordingTimeoutId);
      this.recordingTimeoutId = null;
    }

    this.recognition = null;
    this.isInitialized = false;
    console.log('🧹 Voice service disposed');
  }
}

// Export singleton instance
export const voiceService = new SimplifiedVoiceService();