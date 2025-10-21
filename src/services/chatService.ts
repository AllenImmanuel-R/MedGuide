import { aiAPI } from './api';

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  context?: any;
}

export interface ChatContext {
  userLocation?: string;
  travelDestination?: string;
  medicalHistory?: string[];
  currentSymptoms?: string[];
}

class ChatService {
  private messages: ChatMessage[] = [];
  private context: ChatContext = {};

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await aiAPI.chat(message, this.context);
      
      if (response.success && response.data) {
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          message,
          response: response.data.response,
          timestamp: new Date().toISOString(),
          context: this.context
        };
        
        this.messages.push(chatMessage);
        return response.data.response;
      }
      
      throw new Error(response.message || 'Failed to get AI response');
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  async getSuggestions(): Promise<string[]> {
    try {
      const response = await aiAPI.getSuggestions();
      
      if (response.success && response.data) {
        return response.data.map((suggestion: any) => suggestion.title);
      }
      
      return [];
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  clearMessages(): void {
    this.messages = [];
  }

  setContext(context: ChatContext): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): ChatContext {
    return this.context;
  }

  // Travel-specific chat methods
  async getTravelHealthAdvice(destination: string, currentLocation?: string): Promise<string> {
    const message = `I'm traveling to ${destination}${currentLocation ? ` from ${currentLocation}` : ''}. What health advice do you have for me?`;
    return this.sendMessage(message);
  }

  async getVaccinationAdvice(destination: string): Promise<string> {
    const message = `What vaccinations do I need for traveling to ${destination}?`;
    return this.sendMessage(message);
  }

  async getEmergencyAdvice(symptoms: string[], location: string): Promise<string> {
    const message = `I'm experiencing ${symptoms.join(', ')} in ${location}. What should I do?`;
    return this.sendMessage(message);
  }

  async analyzeMedicalReport(reportData: any): Promise<string> {
    try {
      const response = await aiAPI.analyzeReport(reportData, 'medical');
      
      if (response.success && response.data) {
        return response.data.summary || 'Report analysis completed';
      }
      
      return 'Unable to analyze report at this time';
    } catch (error) {
      console.error('Report analysis error:', error);
      return 'Failed to analyze medical report';
    }
  }
}

export default new ChatService();
