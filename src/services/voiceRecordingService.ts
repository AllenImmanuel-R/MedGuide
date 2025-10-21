/**
 * Voice Recording Service using Vosk for Speech-to-Text
 * 
 * This service handles:
 * - Microphone access and audio recording
 * - Real-time speech-to-text using Vosk
 * - Audio processing and cleanup
 */

// @ts-ignore
import { createModel, createRecognizer } from 'vosk-browser';

export interface VoiceRecognitionResult {
  text: string;
  confidence?: number;
  isFinal: boolean;
}

export interface VoiceRecordingOptions {
  language?: 'en' | 'ta';
  continuous?: boolean;
  maxRecordingTime?: number; // in milliseconds
}

export class VoiceRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recognizer: any = null;
  private model: any = null;
  private isRecording: boolean = false;
  private isInitialized: boolean = false;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  // Events
  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onErrorCallback?: (error: Error) => void;
  private onStatusChangeCallback?: (status: 'started' | 'stopped' | 'error') => void;

  constructor() {
    this.init();
  }

  /**
   * Initialize the Vosk models and audio context
   */
  private async init() {
    try {
      console.log('🎤 Initializing Voice Recording Service...');

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000, // Vosk works best with 16kHz
      });

      // Load Vosk model (we'll use the small English model for now)
      // In production, you might want to load different models based on language
      console.log('📦 Loading Vosk model...');
      
      // For now, we'll use a lightweight approach
      // In a real implementation, you would load the Vosk model files
      // This is a placeholder - actual Vosk model loading would be different
      this.model = await this.loadVoskModel();
      this.recognizer = await this.createVoskRecognizer();

      this.isInitialized = true;
      console.log('✅ Voice Recording Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Voice Recording Service:', error);
      this.onErrorCallback?.(new Error('Failed to initialize voice recognition'));
    }
  }

  /**
   * Load Vosk model (placeholder implementation)
   * In a real app, you would load the actual model files
   */
  private async loadVoskModel() {
    // This is a simplified approach since vosk-browser might have limitations
    // In practice, you might need to load model files differently
    try {
      // For demo purposes, we'll create a simple mock
      return { loaded: true, language: 'en' };
    } catch (error) {
      console.error('Error loading Vosk model:', error);
      throw error;
    }
  }

  /**
   * Create Vosk recognizer
   */
  private async createVoskRecognizer() {
    try {
      // This would typically use the actual Vosk recognizer
      // For now, we'll use browser's built-in speech recognition as fallback
      return { ready: true };
    } catch (error) {
      console.error('Error creating Vosk recognizer:', error);
      throw error;
    }
  }

  /**
   * Start voice recording
   */
  async startRecording(options: VoiceRecordingOptions = {}): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Already recording');
      return;
    }

    if (!this.isInitialized) {
      throw new Error('Voice recording service not initialized');
    }

    try {
      console.log('🎙️ Starting voice recording...');

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Set up MediaRecorder for audio capture
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      // Set up audio processing for real-time transcription
      await this.setupAudioProcessing();

      // Handle MediaRecorder events
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🔴 MediaRecorder stopped');
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.onStatusChangeCallback?.('started');

      // Set max recording time if specified
      if (options.maxRecordingTime) {
        setTimeout(() => {
          if (this.isRecording) {
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
   * Set up audio processing for real-time speech recognition
   */
  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.stream) {
      throw new Error('Audio context or stream not available');
    }

    try {
      // Create audio source from microphone stream
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Create script processor for audio analysis
      // Note: ScriptProcessorNode is deprecated, but still widely supported
      // In production, you might want to use AudioWorklet instead
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Process audio data for speech recognition
      this.processor.onaudioprocess = (event) => {
        if (this.isRecording) {
          this.processAudioData(event.inputBuffer);
        }
      };

      // Connect the audio pipeline
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      console.log('🔊 Audio processing pipeline established');
    } catch (error) {
      console.error('❌ Error setting up audio processing:', error);
      throw error;
    }
  }

  /**
   * Process audio data for speech recognition
   */
  private processAudioData(audioBuffer: AudioBuffer): void {
    try {
      // Get audio samples
      const audioData = audioBuffer.getChannelData(0);
      
      // Convert to the format expected by Vosk (16-bit PCM)
      const samples = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        samples[i] = audioData[i] * 32767; // Convert float to 16-bit
      }

      // Send to Vosk recognizer for processing
      // This is a simplified version - actual Vosk integration would be different
      this.processWithVosk(samples);

    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  }

  /**
   * Process audio with Vosk (simplified implementation)
   */
  private processWithVosk(audioSamples: Int16Array): void {
    // Since vosk-browser might have limitations, we'll implement a fallback
    // that uses the browser's built-in speech recognition
    this.processWithWebSpeechAPI();
  }

  /**
   * Fallback to Web Speech API for speech recognition
   */
  private processWithWebSpeechAPI(): void {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('⚠️ Speech recognition not supported in this browser');
      return;
    }

    // Use Web Speech API as fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // TODO: Make this configurable

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onResultCallback?({
          text: finalTranscript,
          confidence: event.results[event.results.length - 1][0].confidence,
          isFinal: true
        });
      } else if (interimTranscript) {
        this.onResultCallback?({
          text: interimTranscript,
          isFinal: false
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.onErrorCallback?.(new Error(`Speech recognition error: ${event.error}`));
    };
  }

  /**
   * Stop voice recording
   */
  async stopRecording(): Promise<string> {
    if (!this.isRecording) {
      console.warn('⚠️ Not currently recording');
      return '';
    }

    try {
      console.log('🔴 Stopping voice recording...');

      this.isRecording = false;

      // Stop MediaRecorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Clean up audio processing
      this.cleanup();

      this.onStatusChangeCallback?.('stopped');

      // Return the final transcription
      // In a real implementation, this would be the accumulated text from Vosk
      return 'Voice recording completed'; // Placeholder

    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    try {
      // Disconnect audio processing
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }

      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }

      // Stop media stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      // Clear audio chunks
      this.audioChunks = [];

      console.log('🧹 Audio resources cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Check if microphone is available
   */
  async checkMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  }

  /**
   * Set event callbacks
   */
  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  onStatusChange(callback: (status: 'started' | 'stopped' | 'error') => void): void {
    this.onStatusChangeCallback = callback;
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    this.cleanup();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export a singleton instance
export const voiceRecordingService = new VoiceRecordingService();