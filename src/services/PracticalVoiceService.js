/**
 * Practical Voice Service for MedGuide
 * 
 * Strategy: Use reliable English speech recognition + translation
 * This works much better than direct Tamil speech recognition
 */

class PracticalVoiceService {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.userLanguagePreference = 'ta'; // User prefers Tamil
        this.recognitionLanguage = 'en-US'; // But we recognize in English (most reliable)
        
        this.callbacks = {
            onStart: null,
            onResult: null,
            onEnd: null,
            onError: null,
            onTranslation: null
        };
        
        // Common English-Tamil medical phrase mappings for quick recognition
        this.medicalPhraseMap = {
            // Greetings & Basic
            'hello': 'வணக்கம்',
            'hi': 'வணக்கம்',
            'good morning': 'காலை வணக்கம்',
            'good evening': 'மாலை வணக்கம்',
            'thank you': 'நன்றி',
            'please help': 'தயவுசெய்து உதவுங்கள்',
            
            // Symptoms
            'headache': 'தலைவலி',
            'fever': 'காய்ச்சல்',
            'cold': 'சளி',
            'cough': 'இருமல்',
            'stomach pain': 'வயிற்று வலி',
            'back pain': 'முதுகு வலி',
            'chest pain': 'மார்பு வலி',
            'sore throat': 'தொண்டை வலி',
            'runny nose': 'மூக்கில் நீர்',
            'body pain': 'உடல் வலி',
            'tiredness': 'சோர்வு',
            'weakness': 'பலவீனம்',
            'nausea': 'குமட்டல்',
            'vomiting': 'வாந்தி',
            'diarrhea': 'வயிற்றுப்போக்கு',
            'constipation': 'மலச்சிக்கல்',
            'dizziness': 'தலைச்சுற்றல்',
            'sleeplessness': 'தூக்கமின்மை',
            'anxiety': 'பதட்டம்',
            
            // Body parts
            'head': 'தலை',
            'eye': 'கண்',
            'nose': 'மூக்கு',
            'mouth': 'வாய்',
            'throat': 'தொண்டை',
            'chest': 'மார்பு',
            'stomach': 'வயிறு',
            'back': 'முதுகு',
            'hand': 'கை',
            'leg': 'கால்',
            'heart': 'இதயம்',
            'lungs': 'நுரையீரல்',
            
            // Questions
            'how is my health': 'என் உடல்நலம் எப்படி உள்ளது',
            'what should i do': 'நான் என்ன செய்ய வேண்டும்',
            'when should i see a doctor': 'நான் எப்போது மருத்துவரை பார்க்க வேண்டும்',
            'is this serious': 'இது கவலைக்குரியதா',
            'what medicine should i take': 'நான் என்ன மருந்து எடுக்க வேண்டும்',
            'analyze my report': 'என் அறிக்கையை பகுப்பாய்வு செய்யுங்கள்',
            
            // Medical terms
            'doctor': 'மருத்துவர்',
            'medicine': 'மருந்து',
            'hospital': 'மருத்துவமனை',
            'clinic': 'கிளினிக்',
            'treatment': 'சிகிச்சை',
            'prescription': 'மருந்து பரிந்துரை',
            'report': 'அறிக்கை',
            'test': 'பரிசோதனை',
            'blood test': 'ரத்த பரிசோதனை',
            'x-ray': 'எக்ஸ்-ரே',
            'scan': 'ஸ்கேன்',
            'allergy': 'ஒவ்வாமை',
            'diabetes': 'நீரிழிவு',
            'blood pressure': 'ரத்த அழுத்தம்',
            'high blood pressure': 'உயர் ரத்த அழுத்தம்',
            'low blood pressure': 'குறைந்த ரத்த அழுத்தம்'
        };
        
        console.log('🎤 Practical Voice Service initialized (English recognition + Tamil translation)');
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
     * Set user's preferred language for display
     */
    setUserLanguage(language) {
        this.userLanguagePreference = language;
        console.log(`🌐 User language preference: ${language}`);
    }

    /**
     * Translate English text to Tamil using our phrase mappings
     */
    translateToTamil(englishText) {
        if (!englishText || this.userLanguagePreference !== 'ta') {
            return englishText;
        }

        let translated = englishText.toLowerCase();
        
        // Sort by length (longest first) to avoid partial replacements
        const phrases = Object.keys(this.medicalPhraseMap).sort((a, b) => b.length - a.length);
        
        for (const englishPhrase of phrases) {
            if (translated.includes(englishPhrase.toLowerCase())) {
                const tamilTranslation = this.medicalPhraseMap[englishPhrase];
                translated = translated.replace(
                    new RegExp(englishPhrase.toLowerCase(), 'gi'), 
                    tamilTranslation
                );
                console.log(`🔄 Translated "${englishPhrase}" → "${tamilTranslation}"`);
            }
        }

        return translated;
    }

    /**
     * Create smart suggestions for common medical queries
     */
    createSmartSuggestion(recognizedText) {
        const text = recognizedText.toLowerCase();
        
        // If user mentions symptoms, suggest asking about them
        const symptoms = ['pain', 'ache', 'fever', 'cold', 'cough', 'tired', 'sick'];
        const mentionedSymptoms = symptoms.filter(symptom => text.includes(symptom));
        
        if (mentionedSymptoms.length > 0) {
            const suggestion = `I have ${mentionedSymptoms.join(' and ')}. What should I do?`;
            return {
                original: recognizedText,
                suggestion: suggestion,
                tamil: this.translateToTamil(suggestion)
            };
        }
        
        return null;
    }

    /**
     * Initialize speech recognition
     */
    setupRecognition() {
        if (!this.isSupported()) {
            throw new Error('Speech recognition not supported in this browser');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure for optimal English recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Always use English for recognition
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isRecording = true;
            console.log('🎙️ Recording started (English recognition mode)');
            
            if (this.callbacks.onStart) {
                this.callbacks.onStart('en-US');
            }
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence || 0.8; // English recognition is usually good

                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    console.log(`📝 English recognition: "${finalTranscript}" (confidence: ${confidence.toFixed(2)})`);
                    
                    // Translate to Tamil if user prefers Tamil
                    const translatedText = this.translateToTamil(finalTranscript);
                    const smartSuggestion = this.createSmartSuggestion(finalTranscript);
                    
                    if (translatedText !== finalTranscript) {
                        console.log(`🔄 Tamil translation: "${translatedText}"`);
                        
                        if (this.callbacks.onTranslation) {
                            this.callbacks.onTranslation({
                                original: finalTranscript,
                                translated: translatedText,
                                language: 'ta'
                            });
                        }
                    }
                    
                } else {
                    interimTranscript += transcript;
                }
            }

            if (this.callbacks.onResult) {
                this.callbacks.onResult({
                    finalTranscript,
                    interimTranscript,
                    confidence: 0.8, // English recognition is reliable
                    language: 'en-US',
                    translatedText: this.translateToTamil(finalTranscript),
                    userLanguage: this.userLanguagePreference
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('🚫 Voice recognition error:', event.error);
            
            let errorMessage = '';
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = this.userLanguagePreference === 'ta' 
                        ? 'எந்த பேச்சும் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
                        : 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = this.userLanguagePreference === 'ta'
                        ? 'ஆடியோ பதிவு செய்ய முடியவில்லை. மைக்ரோஃபோனை சரிபார்க்கவும்.'
                        : 'Could not capture audio. Please check your microphone.';
                    break;
                case 'not-allowed':
                    errorMessage = this.userLanguagePreference === 'ta'
                        ? 'மைக்ரோஃபோன் அனுமதி தேவை. அனுமதி வழங்கவும்.'
                        : 'Microphone permission required. Please grant access.';
                    break;
                default:
                    errorMessage = this.userLanguagePreference === 'ta'
                        ? `குரல் பதிவில் பிழை: ${event.error}`
                        : `Voice recording error: ${event.error}`;
            }

            if (this.callbacks.onError) {
                this.callbacks.onError({
                    error: event.error,
                    message: errorMessage,
                    language: this.recognitionLanguage
                });
            }
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

            this.recognition.start();
            return true;
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            
            if (this.callbacks.onError) {
                this.callbacks.onError({
                    error: 'start-failed',
                    message: error.message,
                    language: this.recognitionLanguage
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
     * Get service status
     */
    getStatus() {
        return {
            isRecording: this.isRecording,
            recognitionLanguage: this.recognitionLanguage,
            userLanguage: this.userLanguagePreference,
            isSupported: this.isSupported()
        };
    }

    /**
     * Get common medical phrases in both languages
     */
    getMedicalPhrases() {
        return Object.entries(this.medicalPhraseMap).map(([english, tamil]) => ({
            english,
            tamil,
            category: this.categorizeMedicalPhrase(english)
        }));
    }

    /**
     * Categorize medical phrases for better organization
     */
    categorizeMedicalPhrase(phrase) {
        if (['hello', 'hi', 'good morning', 'good evening', 'thank you'].includes(phrase)) {
            return 'greetings';
        }
        if (['headache', 'fever', 'cold', 'cough', 'pain'].some(symptom => phrase.includes(symptom))) {
            return 'symptoms';
        }
        if (['head', 'eye', 'nose', 'chest', 'stomach'].some(part => phrase.includes(part))) {
            return 'body_parts';
        }
        if (['doctor', 'medicine', 'hospital', 'treatment'].some(term => phrase.includes(term))) {
            return 'medical_terms';
        }
        if (phrase.includes('?') || ['how', 'what', 'when', 'should'].some(q => phrase.includes(q))) {
            return 'questions';
        }
        return 'general';
    }
}

export default PracticalVoiceService;