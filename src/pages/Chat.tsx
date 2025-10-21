import { useState, useEffect, useRef } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MotionPage from "@/components/common/MotionPage";
import BackendAIService from "@/services/backendAIService";
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const Chat = () => {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const [aiService] = useState(() => new BackendAIService());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "1",
      role: "assistant",
      content: t('chat:welcomeMessage'),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMessage]);
    setConversationHistory([]); // Clear history when language changes
  }, [i18n.language, t]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


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
      const response = await aiService.generateResponseWithContext(inputText, conversationHistory, i18n.language);
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

  return (
    <MotionPage className="h-screen bg-background flex flex-col">
      <div className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">{t('chat:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('chat:subtitle')}</p>
        </div>
      </div>

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
                <p className="text-sm leading-relaxed">{message.content}</p>
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

      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder="Ask me about general health topics..."
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
          {t('common:medical.disclaimer')}
        </p>
      </div>
    </MotionPage>
  );
};

export default Chat;
