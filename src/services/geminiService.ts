import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface GeminiConfig {
  apiKey: string;
  model?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private conversationHistory: ChatMessage[] = [];

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
  }

  /**
   * Generate a response based on user input with medical context
   */
  async generateResponse(userMessage: string, language: string = 'en'): Promise<string> {
    try {
      const systemPrompt = this.getSystemPrompt(language);
      const contextualMessage = `${systemPrompt}\n\nUser: ${userMessage}`;

      const result = await this.model.generateContent(contextualMessage);
      const response = result.response;
      const responseText = response.text();

      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: responseText }
      );

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return responseText;
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackResponse(language);
    }
  }

  /**
   * Analyze uploaded medical documents or images
   */
  async analyzeDocument(file: File, userQuery?: string, language: string = 'en'): Promise<string> {
    try {
      if (!file.type.startsWith('image/')) {
        return this.getDocumentError(language);
      }

      // Convert file to base64
      const base64Data = await this.fileToBase64(file);
      const mimeType = file.type;

      const systemPrompt = this.getDocumentAnalysisPrompt(language);
      const prompt = userQuery 
        ? `${systemPrompt}\n\nUser query: ${userQuery}\n\nPlease analyze this medical document/image:`
        : `${systemPrompt}\n\nPlease analyze this medical document/image:`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Document analysis error:', error);
      return this.getDocumentError(language);
    }
  }

  /**
   * Detect language of the input text
   */
  async detectLanguage(text: string): Promise<'en' | 'ta'> {
    try {
      const prompt = `Detect if the following text is in English or Tamil. Respond with only "en" for English or "ta" for Tamil: "${text}"`;
      const result = await this.model.generateContent(prompt);
      const response = result.response.text().toLowerCase().trim();
      
      return response === 'ta' ? 'ta' : 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      // Fallback: simple Tamil character detection
      const tamilPattern = /[\u0B80-\u0BFF]/;
      return tamilPattern.test(text) ? 'ta' : 'en';
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  private getSystemPrompt(language: string): string {
    const prompts = {
      en: `You are MedGuide AI, a compassionate healthcare assistant designed to help migrants, travelers, and anyone seeking accessible healthcare guidance. 

Key guidelines:
- Provide helpful, empathetic, and clear health information
- Always emphasize that you provide general information, not professional medical diagnosis
- Recommend consulting healthcare professionals for serious concerns
- Be culturally sensitive and understanding of diverse backgrounds
- Keep responses concise but informative
- Always prioritize user safety and encourage seeking emergency care when appropriate
- If asked about emergencies, immediately direct to emergency services

Important: Never provide specific medical diagnoses or treatment recommendations. Focus on general health education and guidance.`,
      
      ta: `நீங்கள் மெட்கைட் AI, குடியேறிகள், பயணிகள் மற்றும் அணுகக்கூடிய சுகாதார வழிகாட்டுதலைத் தேடும் அனைவருக்கும் உதவ வடிவமைக்கப்பட்ட ஒரு இரக்கமுள்ள சுகாதார உதவியாளர்.

முக்கிய வழிகாட்டுதல்கள்:
- உதவிகரமான, அனுதாபமான மற்றும் தெளிவான சுகாதார தகவலை வழங்குங்கள்
- நீங்கள் பொதுவான தகவலை வழங்குகிறீர்கள், தொழில்முறை மருத்துவ நோயறிதல் அல்ல என்பதை எப்போதும் வலியுறுத்துங்கள்
- தீவிர கவலைகளுக்கு சுகாதார நிபுணர்களை அணுக பரிந்துரைக்கவும்
- பல்வேறு பின்னணிகளுக்கு கலாச்சார உணர்வு மற்றும் புரிதலுடன் இருங்கள்
- பதில்களை சுருக்கமாக ஆனால் தகவலாக வைத்திருங்கள்
- எப்போதும் பயனர் பாதுகாப்பை முன்னுரிமை கொடுத்து, தகுந்தபோது அவசர பராமரிப்பை தேட ஊக்குவிக்கவும்
- அவசர நிலைகள் பற்றி கேட்டால், உடனடியாக அவசர சேவைகளுக்கு வழிநடத்தவும்

முக்கியம்: ஒருபோதும் குறிப்பிட்ட மருத்துவ நோயறிதல்கள் அல்லது சிகிச்சை பரிந்துரைகளை வழங்க வேண்டாம். பொதுவான சுகாதார கல்வி மற்றும் வழிகாட்டுதலில் கவனம் செலுத்துங்கள்.`
    };

    return prompts[language as keyof typeof prompts] || prompts.en;
  }

  private getDocumentAnalysisPrompt(language: string): string {
    const prompts = {
      en: `You are MedGuide AI analyzing a medical document or image. Provide helpful insights about what you see, but remember:
- Never provide specific medical diagnoses
- Focus on explaining what the document/image shows in simple terms
- Suggest consulting healthcare professionals for interpretation
- Be empathetic and supportive
- If you cannot clearly identify the content, be honest about limitations`,
      
      ta: `நீங்கள் மெட்கைட் AI ஒரு மருத்துவ ஆவணம் அல்லது படத்தை பகுப்பாய்வு செய்கிறீர்கள். நீங்கள் பார்ப்பது பற்றி உதவிகரமான நுண்ணறிவுகளை வழங்குங்கள், ஆனால் நினைவில் கொள்ளுங்கள்:
- ஒருபோதும் குறிப்பிட்ட மருத்துவ நோயறிதல்களை வழங்க வேண்டாம்
- ஆவணம்/படம் எளிய வார்த்தைகளில் என்ன காட்டுகிறது என்பதை விளக்குவதில் கவனம் செலுத்துங்கள்
- விளக்கத்திற்கு சுகாதார நிபுணர்களை அணுக பரிந்துரைக்கவும்
- அனுதாபமாகவும் ஆதரவாகவும் இருங்கள்
- உள்ளடக்கத்தை தெளிவாக அடையாளம் காண முடியவில்லை என்றால், வரம்புகள் பற்றி நேர்மையாக இருங்கள்`
    };

    return prompts[language as keyof typeof prompts] || prompts.en;
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
      en: "I'm sorry, I couldn't analyze this document. Please ensure it's a clear image of a medical document. For accurate interpretation of medical documents, please consult your healthcare provider.",
      ta: "மன்னிக்கவும், இந்த ஆவணத்தை என்னால் பகுப்பாய்வு செய்ய முடியவில்லை. இது ஒரு மருத்துவ ஆவணத்தின் தெளிவான படம் என்பதை உறுதிப்படுத்தவும். மருத்துவ ஆவணங்களின் துல்லியமான விளக்கத்திற்கு, தயவுசெய்து உங்கள் சுகாதார வழங்குநரை அணுகவும்."
    };

    return responses[language as keyof typeof responses] || responses.en;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

export default GeminiService;