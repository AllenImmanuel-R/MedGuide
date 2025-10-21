interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    detectedLanguage: string;
    hasMedicalContext: boolean;
    hasComprehensiveAnalysis: boolean;
    analysisType: 'comprehensive_reports' | 'regular_chat';
    timestamp: string;
  };
  error?: string;
  details?: string;
}

interface DocumentAnalysisResponse {
  success: boolean;
  data?: {
    analysis: string;
    filename: string;
    fileType: string;
    fileSize: number;
    language: string;
    timestamp: string;
  };
  error?: string;
  details?: string;
}

interface LanguageDetectionResponse {
  success: boolean;
  data?: {
    detectedLanguage: string;
    confidence: string;
    timestamp: string;
  };
  error?: string;
  details?: string;
}

interface ClinicSuggestionResponse {
  success: boolean;
  data?: {
    specializations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
    keywords: string[];
    timestamp: string;
  };
  error?: string;
  details?: string;
}

class BackendAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  }

  /**
   * Generate AI response via backend
   */
  async generateResponse(userMessage: string, language: string = 'en'): Promise<string> {
    const result = await this.generateResponseWithContext(userMessage, [], language);
    return typeof result === 'string' ? result : result.response;
  }

  /**
   * Generate AI response with conversation context via backend
   */
  async generateResponseWithContext(
    userMessage: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [],
    language: string = 'en',
    userId: string = 'default_user'
  ): Promise<{response: string, hasComprehensiveAnalysis?: boolean, analysisType?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          language,
          conversationHistory,
          userId,
        }),
      });

      const data: ChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate AI response');
      }

      return {
        response: data.data?.response || 'Sorry, I could not generate a response.',
        hasComprehensiveAnalysis: data.data?.hasComprehensiveAnalysis || false,
        analysisType: data.data?.analysisType || 'regular_chat'
      };
    } catch (error) {
      console.error('Backend AI Service Error:', error);
      return {
        response: this.getFallbackResponse(language),
        hasComprehensiveAnalysis: false,
        analysisType: 'regular_chat'
      };
    }
  }

  /**
   * Analyze document via backend
   */
  async analyzeDocument(file: File, userQuery?: string, language: string = 'en'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      if (userQuery) formData.append('query', userQuery);
      formData.append('language', language);

      const response = await fetch(`${this.baseUrl}/ai/analyze-document`, {
        method: 'POST',
        body: formData,
      });

      const data: DocumentAnalysisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze document');
      }

      return data.data?.analysis || 'Sorry, I could not analyze this document.';
    } catch (error) {
      console.error('Document Analysis Error:', error);
      return this.getDocumentError(language);
    }
  }

  /**
   * Detect language via backend
   */
  async detectLanguage(text: string): Promise<'en' | 'ta'> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/detect-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data: LanguageDetectionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to detect language');
      }

      return (data.data?.detectedLanguage as 'en' | 'ta') || 'en';
    } catch (error) {
      console.error('Language Detection Error:', error);
      // Fallback: simple Tamil character detection
      const tamilPattern = /[\u0B80-\u0BFF]/;
      return tamilPattern.test(text) ? 'ta' : 'en';
    }
  }

  /**
   * Get clinic suggestions based on symptoms/message
   */
  async suggestClinics(symptoms: string, language: 'en' | 'ta' = 'en'): Promise<{
    specializations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
    keywords: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/suggest-clinics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms, language }),
      });

      const data: ClinicSuggestionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get clinic suggestions');
      }

      return {
        specializations: data.data?.specializations || [],
        urgencyLevel: data.data?.urgencyLevel || 'low',
        recommendations: data.data?.recommendations || [],
        keywords: data.data?.keywords || []
      };
    } catch (error) {
      console.error('Clinic Suggestion Error:', error);
      // Fallback: use local symptom analysis
      return this.fallbackClinicSuggestion(symptoms, language);
    }
  }

  /**
   * Fallback clinic suggestion using local keyword matching
   */
  private fallbackClinicSuggestion(symptoms: string, language: 'en' | 'ta'): {
    specializations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
    keywords: string[];
  } {
    const lowerSymptoms = symptoms.toLowerCase();
    const specializations: string[] = [];
    let urgencyLevel: 'low' | 'medium' | 'high' | 'emergency' = 'low';
    const recommendations: string[] = [];
    const keywords: string[] = [];

    // Emergency keywords
    const emergencyKeywords = {
      en: ['emergency', 'urgent', 'severe pain', 'heart attack', 'stroke', 'accident', 'critical', 'unconscious', 'bleeding'],
      ta: ['அவசரம்', 'அவசர சிகிச்சை', 'விபத்து', 'கடுமையான வலி', 'இதய படைப்பு', 'பக்கவாதம்']
    };

    // High priority keywords
    const highPriorityKeywords = {
      en: ['chest pain', 'heart', 'cardiac', 'brain', 'stroke', 'seizure', 'cancer', 'tumor'],
      ta: ['மார்பு வலி', 'இதயம்', 'இதய நோய்', 'மூளை', 'பக்கவாதம்', 'வலிப்பு', 'புற்றுநோய்', 'கட்டி']
    };

    // Check for emergency conditions
    const emergencyTerms = emergencyKeywords[language] || emergencyKeywords.en;
    if (emergencyTerms.some(term => lowerSymptoms.includes(term.toLowerCase()))) {
      urgencyLevel = 'emergency';
      specializations.push('emergency');
      recommendations.push(
        language === 'ta' 
          ? '🚨 இது அவசர நிலைமை! உடனடியாக 108 ஐ அழைக்கவும் அல்லது அருகிலுள்ள அவசர சிகிச்சை பிரிவுக்குச் செல்லவும்.'
          : '🚨 This appears to be an emergency! Please call 108 or visit the nearest emergency room immediately.'
      );
    }

    // Check for high priority conditions
    else if (highPriorityKeywords[language]?.some(term => lowerSymptoms.includes(term.toLowerCase()))) {
      urgencyLevel = 'high';
      
      if (lowerSymptoms.includes('heart') || lowerSymptoms.includes('cardiac') || lowerSymptoms.includes('chest pain') ||
          lowerSymptoms.includes('இதயம்') || lowerSymptoms.includes('மார்பு வலி')) {
        specializations.push('cardiology');
        keywords.push('cardiology');
      }
      
      if (lowerSymptoms.includes('brain') || lowerSymptoms.includes('stroke') || lowerSymptoms.includes('seizure') ||
          lowerSymptoms.includes('மூளை') || lowerSymptoms.includes('பக்கவாதம்')) {
        specializations.push('neurology');
        keywords.push('neurology');
      }
      
      if (lowerSymptoms.includes('cancer') || lowerSymptoms.includes('tumor') ||
          lowerSymptoms.includes('புற்றுநோய்') || lowerSymptoms.includes('கட்டி')) {
        specializations.push('oncology');
        keywords.push('oncology');
      }
      
      recommendations.push(
        language === 'ta'
          ? '⚠️ இதற்கு உடனடி மருத்துவ கவனம் தேவை. முடிந்தவரை விரைவில் சிகிச்சை பெறவும்.'
          : '⚠️ This requires prompt medical attention. Please seek care as soon as possible.'
      );
    }

    // Check for other common conditions
    else {
      if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('headache') || lowerSymptoms.includes('cold') ||
          lowerSymptoms.includes('காய்ச்சல்') || lowerSymptoms.includes('தலைவலி') || lowerSymptoms.includes('சளி')) {
        specializations.push('general_medicine');
        urgencyLevel = 'low';
        keywords.push('general_medicine');
      }
      
      if (lowerSymptoms.includes('bone') || lowerSymptoms.includes('joint') || lowerSymptoms.includes('back pain') ||
          lowerSymptoms.includes('எலும்பு') || lowerSymptoms.includes('மூட்டு') || lowerSymptoms.includes('முதுகு வலி')) {
        specializations.push('orthopedics');
        urgencyLevel = urgencyLevel === 'low' ? 'medium' : urgencyLevel;
        keywords.push('orthopedics');
      }
      
      if (lowerSymptoms.includes('skin') || lowerSymptoms.includes('rash') || lowerSymptoms.includes('allergy') ||
          lowerSymptoms.includes('தோல்') || lowerSymptoms.includes('சொறி') || lowerSymptoms.includes('ஒவ்வாமை')) {
        specializations.push('dermatology');
        urgencyLevel = urgencyLevel === 'low' ? 'low' : urgencyLevel;
        keywords.push('dermatology');
      }
      
      if (lowerSymptoms.includes('stomach') || lowerSymptoms.includes('digestive') || lowerSymptoms.includes('abdominal') ||
          lowerSymptoms.includes('வயிறு') || lowerSymptoms.includes('செரிமானம்') || lowerSymptoms.includes('வயிற்று வலி')) {
        specializations.push('gastroenterology');
        urgencyLevel = urgencyLevel === 'low' ? 'medium' : urgencyLevel;
        keywords.push('gastroenterology');
      }
      
      if (lowerSymptoms.includes('child') || lowerSymptoms.includes('baby') || lowerSymptoms.includes('pediatric') ||
          lowerSymptoms.includes('குழந்தை') || lowerSymptoms.includes('சிசு')) {
        specializations.push('pediatrics');
        urgencyLevel = urgencyLevel === 'low' ? 'medium' : urgencyLevel;
        keywords.push('pediatrics');
      }
      
      if (lowerSymptoms.includes('women') || lowerSymptoms.includes('pregnancy') || lowerSymptoms.includes('gynecology') ||
          lowerSymptoms.includes('பெண்கள்') || lowerSymptoms.includes('கர்ப்பம்') || lowerSymptoms.includes('மகப்பேறு')) {
        specializations.push('gynecology');
        urgencyLevel = urgencyLevel === 'low' ? 'medium' : urgencyLevel;
        keywords.push('gynecology');
      }
      
      // Default recommendation
      if (specializations.length === 0) {
        specializations.push('general_medicine');
        recommendations.push(
          language === 'ta'
            ? 'பொது மருத்துவரை சந்திப்பது நல்லது. அவர்கள் உங்களை சரியான நிபுணரிடம் அனுப்புவார்கள்.'
            : 'Consider visiting a general practitioner. They can refer you to the right specialist if needed.'
        );
      }
    }

    return {
      specializations,
      urgencyLevel,
      recommendations,
      keywords
    };
  }

  /**
   * Test backend AI service connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/test`, {
        method: 'GET',
      });

      const data = await response.json();

      return {
        success: data.success,
        message: data.success 
          ? 'Backend AI service is working correctly!' 
          : data.error || 'Backend AI service test failed'
      };
    } catch (error) {
      console.error('Connection Test Error:', error);
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clear conversation history (not applicable for backend service)
   */
  clearHistory(): void {
    // Backend doesn't maintain conversation history in this implementation
    console.log('History cleared (backend service doesn\'t maintain session history)');
  }

  /**
   * Get conversation history (not applicable for backend service)
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    // Backend doesn't maintain conversation history in this implementation
    return [];
  }

  private getFallbackResponse(language: string): string {
    const responses = {
      en: "I'm sorry, I encountered an error processing your request. Please try again, and remember that for any serious health concerns, it's best to consult with a healthcare professional.",
      ta: "மன்னிக்கவும், உங்கள் கோரிக்கையை செயல்படுத்துவதில் எனக்கு பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும், மேலும் எந்தவொரு தீவிர சுகாதார கவலைகளுக்கும் சுகாதார நிபுணரை அணுகுவது சிறந்தது என்பதை நினைவில் கொள்ளுங்கள்."
    };

    return responses[language as keyof typeof responses] || responses.en;
  }

  private getDocumentError(language: string): string {
    const responses = {
      en: "I'm sorry, I couldn't analyze this document. Please ensure it's a clear image or PDF of a medical document. For accurate interpretation of medical documents, please consult your healthcare provider.",
      ta: "மன்னிக்கவும், இந்த ஆவணத்தை என்னால் பகுப்பாய்வு செய்ய முடியவில்லை. இது ஒரு மருத்துவ ஆவணத்தின் தெளிவான படம் அல்லது PDF என்பதை உறுதிப்படுத்தவும். மருத்துவ ஆவணங்களின் துல்லியமான விளக்கத்திற்கு, தயவுசெய்து உங்கள் சுகாதார வழங்குநரை அணுகவும்."
    };

    return responses[language as keyof typeof responses] || responses.en;
  }
}

export default BackendAIService;