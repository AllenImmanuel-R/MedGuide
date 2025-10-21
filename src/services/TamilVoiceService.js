/**
 * Tamil-First Voice Service for MedGuide
 * 
 * Strategy: Try Tamil recognition first, with intelligent fallbacks:
 * 1. Tamil recognition (ta-IN) - for native speakers
 * 2. Auto-switch to English if Tamil fails repeatedly
 * 3. Manual language switching
 * 4. Post-processing to improve Tamil recognition
 */

class TamilVoiceService {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.currentLanguage = 'ta-IN'; // Start with Tamil
        this.userPreference = 'ta-IN'; // User's preferred language
        this.failureCount = 0;
        this.maxFailures = 3; // Switch to English after 3 Tamil failures
        this.autoSwitchEnabled = true;
        
        this.callbacks = {
            onStart: null,
            onResult: null,
            onEnd: null,
            onError: null,
            onLanguageSwitch: null,
            onFallbackSuggestion: null
        };
        
        // Enhanced Tamil medical vocabulary with common variations
        this.tamilMedicalMap = {
            // Common variations and corrections
            'தலை வலி': 'தலைவலி',
            'காய் சல்': 'காய்ச்சல்',
            'மருத் துவர்': 'மருத்துவர்',
            'வயிறு வலி': 'வயிற்று வலி',
            'மார் பு வலி': 'மார்பு வலி',
            'முது கு வலி': 'முதுகு வலி',
            'உடல் நலம்': 'உடல்நலம்',
            
            // Common Tamil medical words that are often misrecognized
            'head': 'தலைவலி',
            'fever': 'காய்ச்சல்',
            'pain': 'வலி',
            'doctor': 'மருத்துவர்',
            'medicine': 'மருந்து',
            'hospital': 'மருத்துவமனை',
            
            // Partial matches that might be recognized
            'தலை': 'தலைவலி',
            'காய்': 'காய்ச்சல்',
            'வயிறு': 'வயிற்று வலி',
            'மார்பு': 'மார்பு வலி',
            'முதுகு': 'முதுகு வலি'
        };
        
        // Common Tamil phrases for medical consultations
        this.tamilPhrases = [
            'வணக்கம் மருத்துவர்',
            'எனக்கு தலைவலி இருக்கிறது',
            'காய்ச்சல் இருக்கிறது',
            'வயிற்று வலி இருக்கிறது',
            'மார்பு வலி உள்ளது',
            'இருமல் வருகிறது',
            'சளி இருக்கிறது',
            'உடல்நலம் எப்படி உள்ளது',
            'என்ன செய்வது',
            'மருத்துவரை பார்க்க வேண்டுமா',
            'என் அறிக்கையை பகுப்பாய்வு செய்யுங்கள்'
        ];
        
        console.log('🎤 Tamil Voice Service initialized (Tamil-first with smart fallbacks)');
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
     * Set user's language preference
     */
    setUserPreference(language) {
        this.userPreference = language;
        this.currentLanguage = language;
        console.log(`🌐 User preference set to: ${language}`);
    }

    /**
     * Switch language manually
     */
    switchLanguage(language) {
        this.currentLanguage = language;
        this.failureCount = 0; // Reset failure count
        console.log(`🔄 Manual language switch to: ${language}`);
        
        if (this.callbacks.onLanguageSwitch) {
            this.callbacks.onLanguageSwitch({
                type: 'manual',
                from: this.userPreference,
                to: language,
                reason: 'user-choice'
            });
        }
    }

    /**
     * Enhance Tamil text recognition using common corrections
     */
    enhanceTamilText(text) {
        if (!text) return text;
        
        let enhanced = text;
        
        // Apply common corrections
        for (const [incorrect, correct] of Object.entries(this.tamilMedicalMap)) {
            const regex = new RegExp(incorrect, 'gi');
            if (enhanced.match(regex)) {
                enhanced = enhanced.replace(regex, correct);
                console.log(`🔧 Tamil correction: "${incorrect}" → "${correct}"`);
            }
        }
        
        return enhanced;
    }

    /**
     * Calculate confidence based on Tamil medical context
     */
    calculateTamilConfidence(text, originalConfidence) {
        if (!text) return originalConfidence;
        
        const lowerText = text.toLowerCase();
        let contextBonus = 0;
        
        // Boost confidence if we detect Tamil medical terms
        const tamilMedicalTerms = ['தலைவலி', 'காய்ச்சல்', 'வலி', 'மருத்துவர்', 'மருந்து', 'உடல்நலம்'];
        const detectedTerms = tamilMedicalTerms.filter(term => lowerText.includes(term));
        
        if (detectedTerms.length > 0) {
            contextBonus = detectedTerms.length * 0.2; // +20% per medical term
            console.log(`✨ Tamil context boost: +${contextBonus.toFixed(2)} for terms:`, detectedTerms);
        }
        
        return Math.min(1.0, (originalConfidence || 0.3) + contextBonus);
    }

    /**
     * Setup speech recognition
     */
    setupRecognition() {
        if (!this.isSupported()) {
            throw new Error('Speech recognition not supported in this browser');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 5; // Get more alternatives for better Tamil recognition

        this.recognition.onstart = () => {
            this.isRecording = true;
            console.log(`🎙️ Recording started in ${this.currentLanguage}`);
            
            if (this.callbacks.onStart) {
                this.callbacks.onStart({
                    language: this.currentLanguage,
                    isPreferredLanguage: this.currentLanguage === this.userPreference
                });
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
     * Handle recognition results
     */
    handleResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        let bestConfidence = 0;
        let alternatives = [];

        // Process all results and alternatives
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 0;

            // Collect alternatives for better Tamil recognition
            if (result.length > 1) {
                for (let j = 0; j < Math.min(result.length, 3); j++) {
                    alternatives.push({
                        text: result[j].transcript,
                        confidence: result[j].confidence || 0
                    });
                }
            }

            if (result.isFinal) {
                finalTranscript += transcript;
                bestConfidence = Math.max(bestConfidence, confidence);
                
                // Enhance Tamil text if we're in Tamil mode
                if (this.currentLanguage === 'ta-IN') {
                    finalTranscript = this.enhanceTamilText(finalTranscript);
                    bestConfidence = this.calculateTamilConfidence(finalTranscript, confidence);
                }
                
                console.log(`📝 ${this.currentLanguage}: "${finalTranscript}" (confidence: ${bestConfidence.toFixed(2)})`);
                
                // Check if Tamil recognition failed and suggest fallback
                if (this.currentLanguage === 'ta-IN' && bestConfidence < 0.4 && finalTranscript.trim().length > 0) {
                    this.handleTamilFailure(finalTranscript, bestConfidence);
                } else {
                    // Reset failure count on successful recognition
                    this.failureCount = 0;
                }
            } else {
                interimTranscript += transcript;
                
                // Enhance interim Tamil text
                if (this.currentLanguage === 'ta-IN') {
                    interimTranscript = this.enhanceTamilText(interimTranscript);
                }
            }
        }

        if (this.callbacks.onResult) {
            this.callbacks.onResult({
                finalTranscript,
                interimTranscript,
                confidence: bestConfidence,
                language: this.currentLanguage,
                alternatives,
                isPreferredLanguage: this.currentLanguage === this.userPreference
            });
        }
    }

    /**
     * Handle Tamil recognition failures
     */
    handleTamilFailure(transcript, confidence) {
        this.failureCount++;
        console.log(`⚠️ Tamil recognition low confidence: ${confidence.toFixed(2)} (failure #${this.failureCount})`);
        
        if (this.failureCount >= this.maxFailures && this.autoSwitchEnabled) {
            console.log('🔄 Suggesting switch to English due to repeated Tamil failures');
            
            if (this.callbacks.onFallbackSuggestion) {
                this.callbacks.onFallbackSuggestion({
                    reason: 'repeated-failures',
                    failureCount: this.failureCount,
                    lastTranscript: transcript,
                    lastConfidence: confidence,
                    suggestedLanguage: 'en-IN'
                });
            }
        }
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
                    ? 'தமிழ் அடையாளம் இந்த உலாவியில் ஆதரிக்கப்படவில்லை.'
                    : 'Language not supported in this browser.';
                shouldSuggestFallback = this.currentLanguage === 'ta-IN';
                break;
                
            case 'network':
                errorMessage = this.currentLanguage === 'ta-IN'
                    ? 'நெட்வொர்க் பிழை. இணைப்பை சரிபார்க்கவும்.'
                    : 'Network error. Please check your connection.';
                shouldSuggestFallback = this.currentLanguage === 'ta-IN';
                break;
                
            default:
                errorMessage = this.currentLanguage === 'ta-IN'
                    ? `குரல் பதிவில் பிழை: ${event.error}`
                    : `Voice recording error: ${event.error}`;
                shouldSuggestFallback = this.currentLanguage === 'ta-IN';
        }

        if (shouldSuggestFallback && this.autoSwitchEnabled) {
            if (this.callbacks.onFallbackSuggestion) {
                this.callbacks.onFallbackSuggestion({
                    reason: 'error',
                    error: event.error,
                    suggestedLanguage: 'en-IN'
                });
            }
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
            console.log(`🎙️ Starting recording in ${this.currentLanguage}`);
            
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
     * Get current status
     */
    getStatus() {
        return {
            isRecording: this.isRecording,
            currentLanguage: this.currentLanguage,
            userPreference: this.userPreference,
            failureCount: this.failureCount,
            autoSwitchEnabled: this.autoSwitchEnabled,
            isSupported: this.isSupported()
        };
    }

    /**
     * Get Tamil phrases for practice
     */
    getTamilPhrases() {
        return this.tamilPhrases.map((phrase, index) => ({
            id: index,
            tamil: phrase,
            category: this.categorizeTamilPhrase(phrase)
        }));
    }

    /**
     * Categorize Tamil phrases
     */
    categorizeTamilPhrase(phrase) {
        if (phrase.includes('வணக்கம்')) return 'greeting';
        if (phrase.includes('வலி') || phrase.includes('காய்ச்சல்') || phrase.includes('இருமல்')) return 'symptoms';
        if (phrase.includes('மருத்துவர்') || phrase.includes('மருந்து')) return 'medical';
        if (phrase.includes('எப்படி') || phrase.includes('என்ன')) return 'questions';
        return 'general';
    }

    /**
     * Enable/disable auto-switch feature
     */
    setAutoSwitch(enabled) {
        this.autoSwitchEnabled = enabled;
        console.log(`🔄 Auto-switch ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Reset failure count (useful when user wants to try Tamil again)
     */
    resetFailureCount() {
        this.failureCount = 0;
        console.log('🔄 Failure count reset');
    }
}

export default TamilVoiceService;