import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, FileText, Settings, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MotionPage from "@/components/common/MotionPage";
import MedicalReportUpload from "@/components/MedicalReportUpload";
import BackendAIService from "@/services/backendAIService";
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface UploadedReport {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedText?: string;
  medicalData?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    dates: string[];
    symptoms: string[];
  };
}

const EnhancedChat = () => {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const [aiService] = useState(() => new BackendAIService());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [userId] = useState('default_user'); // In production, get from auth
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "1",
      role: "assistant",
      content: getWelcomeMessage(),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMessage]);
    setConversationHistory([]); // Clear history when language changes
  }, [i18n.language, uploadedReports.length]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = () => {
    const hasReports = uploadedReports.some(r => r.status === 'completed');
    if (hasReports) {
      const reportCount = uploadedReports.filter(r => r.status === 'completed').length;
      return i18n.language === 'en' 
        ? `Hello! I'm MedGuide, your medical assistant. I can see you have uploaded ${reportCount} medical report${reportCount > 1 ? 's' : ''}. I'll use this information to provide more personalized health guidance. How can I help you today?`
        : `வணக்கம்! நான் மெட்கைட், உங்கள் மருத்துவ உதவியாளர். நீங்கள் ${reportCount} மருத்துவ அறிக்கை${reportCount > 1 ? 'கள்' : ''}களை பதிவேற்றியிருப்பதை என்னால் பார்க்க முடிகிறது. மேலும் தனிப்பயனாக்கப்பட்ட சுகாதார வழிகாட்டுதலை வழங்க இந்த தகவலைப் பயன்படுத்துவேன். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`;
    }
    return t('chat:welcomeMessage');
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const inputText = input;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Add to conversation history
    const newUserHistory = { role: 'user' as const, content: inputText };
    setConversationHistory(prev => [...prev, newUserHistory]);
    
    setInput("");
    setIsTyping(true);

    try {
      const response = await aiService.generateResponseWithContext(
        inputText, 
        conversationHistory, 
        i18n.language, 
        userId
      );
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Add assistant response to conversation history
      const newBotHistory = { role: 'assistant' as const, content: response };
      setConversationHistory(prev => [...prev, newUserHistory, newBotHistory]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t('chat:responses.error'),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearConversation = () => {
    const welcomeMessage: Message = {
      id: "1",
      role: "assistant",
      content: getWelcomeMessage(),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMessage]);
    setConversationHistory([]);
    setShowSettings(false);
  };

  const handleReportsChange = (reports: UploadedReport[]) => {
    setUploadedReports(reports);
  };

  const getMedicalSummary = () => {
    const completedReports = uploadedReports.filter(r => r.status === 'completed');
    if (completedReports.length === 0) return null;

    const allConditions = new Set<string>();
    const allMedications = new Set<string>();
    const allAllergies = new Set<string>();

    completedReports.forEach(report => {
      if (report.medicalData) {
        report.medicalData.conditions.forEach(c => allConditions.add(c));
        report.medicalData.medications.forEach(m => allMedications.add(m));
        report.medicalData.allergies.forEach(a => allAllergies.add(a));
      }
    });

    return {
      reportCount: completedReports.length,
      conditions: Array.from(allConditions).slice(0, 5),
      medications: Array.from(allMedications).slice(0, 5),
      allergies: Array.from(allAllergies).slice(0, 3)
    };
  };

  const medicalSummary = getMedicalSummary();

  return (
    <MotionPage className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              {t('chat:title')}
              {medicalSummary && (
                <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {medicalSummary.reportCount} {i18n.language === 'en' ? 'reports loaded' : 'அறிக்கைகள் ஏற்றப்பட்டுள்ளது'}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{t('chat:subtitle')}</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  {i18n.language === 'en' ? 'Upload Reports' : 'அறிக்கைகளை பதிவேற்றுக'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {i18n.language === 'en' ? 'Upload Medical Reports' : 'மருத்துவ அறிக்கைகளை பதிவேற்றுக'}
                  </DialogTitle>
                  <DialogDescription>
                    {i18n.language === 'en' 
                      ? 'Upload your medical reports, lab results, or prescriptions to get personalized health guidance.'
                      : 'தனிப்பயனாக்கப்பட்ட சுகாதார வழிகாட்டுதலைப் பெற உங்கள் மருத்துவ அறிக்கைகள், ஆய்வகம் முடிவுகள் அல்லது மருந்து சீட்டுகளை பதிவேற்றுங்கள்.'}
                  </DialogDescription>
                </DialogHeader>
                <MedicalReportUpload onReportsChange={handleReportsChange} />
              </DialogContent>
            </Dialog>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{i18n.language === 'en' ? 'Chat Settings' : 'உரையாடல் அமைப்புகள்'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Button 
                    onClick={handleClearConversation}
                    variant="destructive"
                    className="w-full"
                  >
                    {i18n.language === 'en' ? 'Clear Conversation' : 'உரையாடலை அழிக்கவும்'}
                  </Button>
                  
                  {medicalSummary && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-2">
                        {i18n.language === 'en' ? 'Medical Context Summary' : 'மருத்துவ சூழல் சுருக்கம்'}
                      </h3>
                      <div className="text-sm space-y-2">
                        <p><strong>{i18n.language === 'en' ? 'Reports:' : 'அறிக்கைகள்:'}</strong> {medicalSummary.reportCount}</p>
                        {medicalSummary.conditions.length > 0 && (
                          <p><strong>{i18n.language === 'en' ? 'Conditions:' : 'நிலைமைகள்:'}</strong> {medicalSummary.conditions.join(', ')}</p>
                        )}
                        {medicalSummary.medications.length > 0 && (
                          <p><strong>{i18n.language === 'en' ? 'Medications:' : 'மருந்துகள்:'}</strong> {medicalSummary.medications.join(', ')}</p>
                        )}
                        {medicalSummary.allergies.length > 0 && (
                          <p><strong>{i18n.language === 'en' ? 'Allergies:' : 'ஒவ்வாமைகள்:'}</strong> {medicalSummary.allergies.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="p-2 rounded-full bg-primary/10 h-fit">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <Card
                className={`p-4 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className={`mt-1 text-[10px] ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {message.createdAt}
                </div>
              </Card>
              {message.role === "user" && (
                <div className="p-2 rounded-full bg-accent/10 h-fit">
                  <User className="w-5 h-5 text-accent" />
                </div>
              )}
            </div>
          ))}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="p-2 rounded-full bg-primary/10 h-fit">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <Card className="p-4 max-w-[80%] bg-card">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder={
              medicalSummary 
                ? (i18n.language === 'en' ? "Ask about your health based on your medical reports..." : "உங்கள் மருத்துவ அறிக்கைகளின் அடிப்படையில் உங்கள் ஆரோக்கியத்தைப் பற்றி கேளுங்கள்...")
                : (i18n.language === 'en' ? "Ask me about general health topics..." : "பொதுவான சுகாதார தலைப்புகளைப் பற்றி என்னிடம் கேளுங்கள்...")
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} className="bg-gradient-primary">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2 max-w-4xl mx-auto">
          {medicalSummary && (
            <span className="text-blue-600 mr-2">
              ✓ {i18n.language === 'en' ? 'Using your medical history for personalized guidance' : 'தனிப்பயனாக்கப்பட்ட வழிகாட்டுதலுக்கு உங்கள் மருத்துவ வரலாற்றைப் பயன்படுத்துகிறது'}
            </span>
          )}
          {t('common:medical.disclaimer')}
        </p>
      </div>
    </MotionPage>
  );
};

export default EnhancedChat;