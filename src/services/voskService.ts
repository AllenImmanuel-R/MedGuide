import { createModel, createRecognizer, Model, Recognizer } from 'vosk-browser';

interface VoskConfig {
  modelPath: string;
  sampleRate?: number;
}

interface RecognitionResult {
  text: string;
  partial?: boolean;
  confidence?: number;
}

class VoskService {
  private model: Model | null = null;
  private recognizer: Recognizer | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private sampleRate: number;
  private isInitialized: boolean = false;
  private isRecording: boolean = false;
  private onResult?: (result: RecognitionResult) => void;
  private onError?: (error: string) => void;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(config: VoskConfig) {
    this.sampleRate = config.sampleRate || 16000;
  }

  /**
   * Initialize Vosk with the model
   */
  async initialize(modelPath: string): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Check if browser supports required features
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('Web Audio API not supported');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      // Load the Vosk model
      this.model = await createModel(modelPath);
      this.recognizer = await createRecognizer(this.model, this.sampleRate);
      
      this.isInitialized = true;
      console.log('Vosk service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Vosk:', error);
      throw new Error(`Vosk initialization failed: ${error}`);
    }
  }

  /**
   * Start speech recognition
   */
  async startRecognition(): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('Vosk service not initialized');
      }

      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate,
      });

      // Create audio source from microphone
      this.source = this.audioContext.createMediaStreamSource(this.audioStream);

      // Create script processor for audio processing
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Process audio data
      this.processor.onaudioprocess = (event) => {
        if (!this.recognizer || !this.isRecording) return;

        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert float32 to int16
        const buffer = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          buffer[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        // Send to Vosk recognizer
        try {
          const result = this.recognizer.acceptWaveform(buffer);
          if (result) {
            const recognition = JSON.parse(this.recognizer.result());
            if (recognition.text && recognition.text.trim()) {
              this.onResult?.({
                text: recognition.text.trim(),
                partial: false,
                confidence: recognition.conf || 1.0,
              });
            }
          } else {
            // Partial result
            const partial = JSON.parse(this.recognizer.partialResult());
            if (partial.partial && partial.partial.trim()) {
              this.onResult?.({
                text: partial.partial.trim(),
                partial: true,
              });
            }
          }
        } catch (error) {
          console.error('Recognition error:', error);
          this.onError?.('Recognition processing error');
        }
      };

      // Connect audio nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.onError?.(`Failed to start recognition: ${error}`);
      this.cleanup();
    }
  }

  /**
   * Stop speech recognition
   */
  async stopRecognition(): Promise<string> {
    try {
      if (!this.isRecording) {
        return '';
      }

      this.isRecording = false;

      // Get final result
      let finalText = '';
      if (this.recognizer) {
        try {
          const result = JSON.parse(this.recognizer.finalResult());
          finalText = result.text || '';
        } catch (error) {
          console.error('Error getting final result:', error);
        }
      }

      this.cleanup();
      console.log('Speech recognition stopped');
      
      return finalText.trim();
    } catch (error) {
      console.error('Failed to stop recognition:', error);
      this.cleanup();
      return '';
    }
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Set result callback
   */
  setOnResult(callback: (result: RecognitionResult) => void): void {
    this.onResult = callback;
  }

  /**
   * Set error callback
   */
  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  /**
   * Get supported languages/models
   */
  getSupportedLanguages(): Array<{ code: string; name: string; modelPath: string }> {
    return [
      {
        code: 'en',
        name: 'English',
        modelPath: '/models/vosk-model-en-us-0.22', // Your existing model
      },
      {
        code: 'ta',
        name: 'Tamil',
        modelPath: '/models/vosk-model-en-us-0.22', // Use same model for now
      },
    ];
  }

  /**
   * Switch to different language model
   */
  async switchLanguage(languageCode: string): Promise<void> {
    const supportedLangs = this.getSupportedLanguages();
    const langConfig = supportedLangs.find(lang => lang.code === languageCode);
    
    if (!langConfig) {
      throw new Error(`Language ${languageCode} not supported`);
    }

    // Stop current recognition if running
    if (this.isRecording) {
      await this.stopRecognition();
    }

    // Reinitialize with new model
    this.cleanup();
    this.isInitialized = false;
    await this.initialize(langConfig.modelPath);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    // Disconnect audio nodes
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Destroy service and clean up all resources
   */
  destroy(): void {
    this.stopRecognition();
    this.cleanup();
    
    if (this.recognizer) {
      this.recognizer = null;
    }
    
    if (this.model) {
      this.model = null;
    }
    
    this.isInitialized = false;
  }

  /**
   * Check if microphone permission is granted
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Get browser compatibility info
   */
  getBrowserCompatibility(): { 
    isSupported: boolean; 
    missingFeatures: string[] 
  } {
    const missingFeatures: string[] = [];

    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      missingFeatures.push('Web Audio API');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      missingFeatures.push('Media Devices API');
    }

    if (!window.WebAssembly) {
      missingFeatures.push('WebAssembly');
    }

    return {
      isSupported: missingFeatures.length === 0,
      missingFeatures,
    };
  }
}

export default VoskService;