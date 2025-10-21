/**
 * Hybrid Voice Recording Service for MedGuide
 * 
 * Provides multiple voice recognition strategies:
 * 1. Tamil recognition (ta-IN) for native speakers
 * 2. English recognition (en-IN) as fallback
 * 3. Auto-detection and language switching
 * 4. Manual language selection
 */

class HybridVoiceService {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.currentLanguage = 'ta-IN'; // Default to Tamil
        this.supportedLanguages = {
            'ta-IN': { name: 'தமிழ்', flag: '🇮🇳', code: 'ta-IN' },
            'en-IN': { name: 'English (India)', flag: '🇮🇳', code: 'en-IN' },
            'en-US': { name: 'English (US)', flag: '🇺🇸', code: 'en-US' }
        };
        this.confidenceThreshold = 0.7; // Minimum confidence for Tamil
        this.autoSwitchEnabled = true;
        this.fallbackAttempts = 0;
        this.maxFallbackAttempts = 2;
        
        // Medical keywords for better recognition
        this.tamilMedicalKeywords = [
            'தலைவலி', 'காய்ச்சல்', 'இருமல்', 'வயிற்றுவலி', 'மருத்துவர்',
            'மருந்து', 'உடல்நலம்', 'வலி', 'சோர்வு', 'தூக்கமின்மை'
        ];
        
        this.callbacks = {
            onStart: null,
            onResult: null,
            onEnd: null,
            onError: null,
            onLanguageSwitch: null
        };
        
        console.log('🎤 Hybrid Voice Service initialized');
    }

    /**
     * Check if speech recognition is supported
     */
    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Set callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Set current language
     */
    setLanguage(languageCode) {
        if (this.supportedLanguages[languageCode]) {
            this.currentLanguage = languageCode;
            console.log(`🌐 Language switched to: ${this.supportedLanguages[languageCode].name}`);
            
            if (this.callbacks.onLanguageSwitch) {
                this.callbacks.onLanguageSwitch(languageCode, this.supportedLanguages[languageCode]);
            }
        }
    }

    /**
     * Toggle auto-switch feature
     */
    setAutoSwitch(enabled) {
        this.autoSwitchEnabled = enabled;
        console.log(`🔄 Auto-switch ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Initialize speech recognition
     */
    setupRecognition() {
        if (!this.isSupported()) {
            throw new Error('Speech recognition not supported');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

        // Event handlers
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.fallbackAttempts = 0;
            console.log(`🎙️ Recording started in ${this.supportedLanguages[this.currentLanguage].name}`);
            
            if (this.callbacks.onStart) {
                this.callbacks.onStart(this.currentLanguage);
            }
        };

        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleError(event);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            console.log('🔴 Recording ended');
            
            if (this.callbacks.onEnd) {
                this.callbacks.onEnd();
            }
        };
    }

    /**
     * Handle recognition results with confidence checking
     */
    handleResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;
        let bestAlternative = null;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 0;

            if (result.isFinal) {
                finalTranscript += transcript;
                
                // Check all alternatives for better confidence
                for (let j = 0; j < result.length; j++) {
                    const alt = result[j];
                    if (alt.confidence > maxConfidence) {
                        maxConfidence = alt.confidence;
                        bestAlternative = alt;
                    }
                }

                // If Tamil confidence is low and auto-switch is enabled
                if (this.currentLanguage === 'ta-IN' && 
                    confidence < this.confidenceThreshold && 
                    this.autoSwitchEnabled &&
                    this.fallbackAttempts < this.maxFallbackAttempts) {
                    
                    console.log(`⚠️ Tamil confidence low (${confidence.toFixed(2)}), suggesting English fallback`);
                    this.suggestLanguageSwitch();
                    return;
                }

                console.log(`📝 Final: "${finalTranscript}" (confidence: ${confidence.toFixed(2)})`);
            } else {
                interimTranscript += transcript;
            }
        }

        // Enhance Tamil recognition with keyword matching
        if (this.currentLanguage === 'ta-IN' && finalTranscript) {
            finalTranscript = this.enhanceTamilRecognition(finalTranscript);
        }

        if (this.callbacks.onResult) {
            this.callbacks.onResult({
                finalTranscript,
                interimTranscript,
                confidence: maxConfidence,
                language: this.currentLanguage,
                alternatives: bestAlternative ? [bestAlternative] : []
            });
        }
    }

    /**
     * Enhance Tamil recognition using keyword matching and common corrections
     */
    enhanceTamilRecognition(transcript) {
        let enhanced = transcript;
        
        // Common Tamil speech recognition corrections
        const corrections = {
            'தலै வலி': 'தலைவலி',
            'காய் சல்': 'காய்ச்சல்',
            'மருத் துவர்': 'மருத்துவர்',
            'வயிறு வலி': 'வயிற்றுவலி',
            'உடல் நலம்': 'உடல்நலம்'
        };

        for (const [wrong, correct] of Object.entries(corrections)) {
            enhanced = enhanced.replace(new RegExp(wrong, 'gi'), correct);
        }

        return enhanced;
    }

    /**
     * Handle recognition errors
     */
    handleError(event) {
        console.error('🚫 Recognition error:', event.error);
        
        let errorMessage = '';
        let shouldSuggestFallback = false;

        switch (event.error) {
            case 'no-speech':
                errorMessage = this.currentLanguage === 'ta-IN' 
                    ? 'எந்த பேச்சும் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
                    : 'No speech detected. Please try again.';
                break;
            
            case 'audio-capture':
                errorMessage = this.currentLanguage === 'ta-IN'
                    ? 'ஆடியோ பதிவு செய்ய முடியவில்லை. மைக்ரோஃபோனை சரிபார்க்கவும்.'
                    : 'Could not capture audio. Please check your microphone.';
                break;
            
            case 'not-allowed':
                errorMessage = this.currentLanguage === 'ta-IN'
                    ? 'மைக்ரோஃபோன் அனுமதி தேவை. அனுமதி வழங்கவும்.'
                    : 'Microphone permission required. Please grant access.';
                break;
            
            case 'language-not-supported':
                errorMessage = this.currentLanguage === 'ta-IN'
                    ? 'தமிழ் அடையாளம் ஆதரிக்கப்படவில்லை. ஆங்கிலம் முயற்சிக்கவும்.'
                    : 'Language not supported. Switching to English.';
                shouldSuggestFallback = true;
                break;
            
            default:
                errorMessage = this.currentLanguage === 'ta-IN'
                    ? `குரல் பதிவில் பிழை: ${event.error}`
                    : `Voice recording error: ${event.error}`;
                shouldSuggestFallback = this.currentLanguage === 'ta-IN';
        }

        if (shouldSuggestFallback && this.autoSwitchEnabled) {
            this.suggestLanguageSwitch();
        }

        if (this.callbacks.onError) {
            this.callbacks.onError({
                error: event.error,
                message: errorMessage,
                language: this.currentLanguage,
                suggestFallback: shouldSuggestFallback
            });
        }
    }

    /**
     * Suggest switching to English as fallback
     */
    suggestLanguageSwitch() {
        this.fallbackAttempts++;
        
        if (this.fallbackAttempts <= this.maxFallbackAttempts) {
            console.log('🔄 Suggesting language switch to English');
            
            if (this.callbacks.onLanguageSwitch) {
                this.callbacks.onLanguageSwitch('suggest-english', {
                    currentLang: this.currentLanguage,
                    suggestedLang: 'en-IN',
                    reason: 'low-confidence',
                    attempts: this.fallbackAttempts
                });
            }
        }
    }

    /**
     * Start recording
     */
    async startRecording() {
        if (this.isRecording) {
            console.log('⚠️ Recording already in progress');
            return false;
        }

        try {
            if (!this.recognition) {
                this.setupRecognition();
            }

            // Update language setting
            this.recognition.lang = this.currentLanguage;
            
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            
            if (this.callbacks.onError) {
                this.callbacks.onError({
                    error: 'start-failed',
                    message: error.message,
                    language: this.currentLanguage
                });
            }
            return false;
        }
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            return true;
        }
        return false;
    }

    /**
     * Get current language info
     */
    getCurrentLanguage() {
        return {
            code: this.currentLanguage,
            ...this.supportedLanguages[this.currentLanguage]
        };
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Get service statistics
     */
    getStats() {
        return {
            isRecording: this.isRecording,
            currentLanguage: this.currentLanguage,
            fallbackAttempts: this.fallbackAttempts,
            autoSwitchEnabled: this.autoSwitchEnabled,
            confidenceThreshold: this.confidenceThreshold
        };
    }
}

export default HybridVoiceService;