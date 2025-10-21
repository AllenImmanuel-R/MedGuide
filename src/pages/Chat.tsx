import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, MapPin, Globe, Shield, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import chatService from "@/services/chatService";
import type { ChatMessage, ChatContext } from "@/services/chatService";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [context, setContext] = useState<ChatContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load chat history and suggestions
  useEffect(() => {
    const loadChatData = async () => {
      try {
        // Load previous messages
        const chatMessages = chatService.getMessages();
        setMessages(chatMessages);

        // Load suggestions
        const chatSuggestions = await chatService.getSuggestions();
        setSuggestions(chatSuggestions);

        // Set user context
        if (user) {
          const userContext: ChatContext = {
            userLocation: 'Current Location', // This would be determined by geolocation
            travelDestination: 'Not specified',
            medicalHistory: [],
            currentSymptoms: []
          };
          chatService.setContext(userContext);
          setContext(userContext);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      }
    };

    loadChatData();
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    try {
      setIsLoading(true);
      setInputMessage('');

      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        message: messageToSend,
        response: '',
        timestamp: new Date().toISOString(),
        context
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await chatService.sendMessage(messageToSend);
      
      // Update the message with AI response
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, response }
          : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTravelHealthAdvice = async (destination: string) => {
    try {
      setIsLoading(true);
      const response = await chatService.getTravelHealthAdvice(destination);
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        message: `Travel health advice for ${destination}`,
        response,
        timestamp: new Date().toISOString(),
        context
      };
      
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error getting travel advice:', error);
      toast({
        title: 'Error',
        description: 'Failed to get travel health advice.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Travel Health Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Get instant health guidance for your travel destination and medical needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="border-0 shadow-lg h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                  AI Health Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about travel health, medical advice, or get destination-specific guidance
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        {/* User Message */}
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-blue-100 rounded-lg p-3">
                              <p className="text-gray-900">{message.message}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {/* AI Response */}
                        {message.response && (
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-gray-900 whitespace-pre-wrap">{message.response}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                AI Assistant
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-gray-600">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about travel health, medical advice, or destination guidance..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => getTravelHealthAdvice('Japan')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Japan Travel Health
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => getTravelHealthAdvice('Thailand')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Thailand Travel Health
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => getTravelHealthAdvice('Singapore')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Singapore Travel Health
                </Button>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="text-sm">{suggestion}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Context Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Your Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{context.userLocation || 'Not specified'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span>{context.travelDestination || 'Not specified'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span>{context.medicalHistory?.length || 0} medical records</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Chat;