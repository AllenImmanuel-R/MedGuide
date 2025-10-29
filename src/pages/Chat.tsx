import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, MessageCircle, Moon, Sun, Plus, Home, MapPin, ImagePlus, X, Mic, MicOff, Volume2, VolumeX, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useTheme } from "@/components/theme-provider";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from 'react-i18next';
import { aiAPI } from "@/services/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from "react-router-dom";
import { clinicFinderService } from "@/services/clinicServices";
import type { Clinic } from "@/services/ClinicFinderService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  imageUrl?: string;
  imageData?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>;
  createdAt: string;
  updatedAt: string;
}

const Chat = () => {
  const { i18n } = useTranslation(['common', 'chat']);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialize Gemini AI as fallback
  const [geminiAI] = useState(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      return new GoogleGenerativeAI(apiKey);
    }
    return null;
  });

  // Initialize speech synthesis and recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
      
      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = i18n.language === 'en' ? 'en-US' : 'ta-IN';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('🎤 Voice input:', transcript);
          setInputMessage(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: i18n.language === 'en' ? 'Voice Error' : 'குரல் பிழை',
            description: i18n.language === 'en' ? 'Could not recognize speech' : 'பேச்சை அடையாளம் காண முடியவில்லை',
            variant: 'destructive'
          });
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [i18n.language, toast]);

  // Speak text using text-to-speech in specified language
  const speakTextInLanguage = (text: string, lang: 'en' | 'ta') => {
    if (!synthesisRef.current || !voiceEnabled) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'ta-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    console.log(`🔊 Speaking in ${lang === 'en' ? 'English' : 'Tamil'}`);
    synthesisRef.current.speak(utterance);
  };

  // Toggle voice input (microphone)
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: i18n.language === 'en' ? 'Not Supported' : 'ஆதரிக்கப்படவில்லை',
        description: i18n.language === 'en' 
          ? 'Voice input is not supported in this browser' 
          : 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை',
        variant: 'destructive'
      });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = i18n.language === 'en' ? 'en-US' : 'ta-IN';
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: i18n.language === 'en' ? 'Listening...' : 'கேட்கிறது...',
          description: i18n.language === 'en' ? 'Speak now' : 'இப்போது பேசுங்கள்',
        });
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Toggle voice output
  const toggleVoiceOutput = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    
    if (!newState && synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
    
    toast({
      title: i18n.language === 'en' ? 'Voice Output' : 'குரல் வெளியீடு',
      description: i18n.language === 'en' 
        ? (newState ? 'Voice output enabled' : 'Voice output disabled')
        : (newState ? 'குரல் வெளியீடு இயக்கப்பட்டது' : 'குரல் வெளியீடு முடக்கப்பட்டது'),
    });
  };

  // Load all conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = () => {
      try {
        const savedConversations = localStorage.getItem('medguide_conversations');
        const lastConversationId = localStorage.getItem('medguide_last_conversation_id');
        
        if (savedConversations) {
          const parsed: Conversation[] = JSON.parse(savedConversations);
          setConversations(parsed);
          
          // Load the last active conversation or the most recent one
          const conversationToLoad = lastConversationId 
            ? parsed.find(c => c.id === lastConversationId) || parsed[0]
            : parsed[0];
          
          if (conversationToLoad) {
            console.log('📚 Loaded conversation:', conversationToLoad.title);
            setMessages(conversationToLoad.messages);
            setConversationHistory(conversationToLoad.conversationHistory);
            setCurrentConversationId(conversationToLoad.id);
            setIsHistoryLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error loading conversations:', error);
      }
      
      // If no conversations, start a new one
      startNewConversation();
    };
    
    loadConversations();
  }, []);
  
  // Update welcome message when language changes (but keep history)
  useEffect(() => {
    if (!isHistoryLoaded) return;
    
    // Only update welcome message if it's the only message
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const welcomeMessage: Message = {
        id: "1",
        role: "assistant",
        content: getWelcomeMessage(),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([welcomeMessage]);
    }
  }, [i18n.language, isHistoryLoaded]);
  
  // Save current conversation whenever messages change
  useEffect(() => {
    if (!isHistoryLoaded || !currentConversationId) return;
    
    try {
      const updatedConversations = conversations.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages,
            conversationHistory,
            updatedAt: new Date().toISOString(),
            // Auto-generate title from first user message if still default
            title: conv.title.startsWith('New Chat') && messages.length > 1 && messages[1]?.role === 'user'
              ? generateTitle(messages[1].content)
              : conv.title
          };
        }
        return conv;
      });
      
      setConversations(updatedConversations);
      localStorage.setItem('medguide_conversations', JSON.stringify(updatedConversations));
      localStorage.setItem('medguide_last_conversation_id', currentConversationId);
      console.log('💾 Saved conversation:', currentConversationId);
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
    }
  }, [messages, conversationHistory, isHistoryLoaded, currentConversationId]);
  
  // Generate conversation title from first message
  const generateTitle = (message: string): string => {
    const maxLength = 30;
    const cleaned = message.trim().replace(/\n/g, ' ');
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...'
      : cleaned;
  };
  
  // Start a new conversation
  const startNewConversation = () => {
    const welcomeMessage: Message = {
      id: "1",
      role: "assistant",
      content: getWelcomeMessage(),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: i18n.language === 'en' ? 'New Chat' : 'புதிய உரையாடல்',
      messages: [welcomeMessage],
      conversationHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setMessages([welcomeMessage]);
    setConversationHistory([]);
    setCurrentConversationId(newConversation.id);
    setIsHistoryLoaded(true);
    
    localStorage.setItem('medguide_conversations', JSON.stringify(updatedConversations));
    localStorage.setItem('medguide_last_conversation_id', newConversation.id);
    
    console.log('✨ Started new conversation:', newConversation.id);
  };
  
  // Load a specific conversation
  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setConversationHistory(conversation.conversationHistory);
      setCurrentConversationId(conversation.id);
      localStorage.setItem('medguide_last_conversation_id', conversation.id);
      console.log('📂 Loaded conversation:', conversation.title);
    }
  };
  
  // Delete a conversation
  const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    localStorage.setItem('medguide_conversations', JSON.stringify(updatedConversations));
    
    // If deleting current conversation, load another or start new
    if (conversationId === currentConversationId) {
      if (updatedConversations.length > 0) {
        loadConversation(updatedConversations[0].id);
      } else {
        startNewConversation();
      }
    }
    
    toast({
      title: i18n.language === 'en' ? 'Chat Deleted' : 'உரையாடல் நீக்கப்பட்டது',
      description: i18n.language === 'en' ? 'Conversation removed' : 'உரையாடல் அகற்றப்பட்டது',
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = () => {
    return i18n.language === 'en'
      ? "Hello! I'm MedGuide, your AI health assistant powered by Gemini. I can help you with medical questions, travel health advice, symptom analysis, and more. How can I help you today?"
      : "வணக்கம்! நான் மெட்கைட், Gemini ஆல் இயக்கப்படும் உங்கள் AI சுகாதார உதவியாளர். மருத்துவ கேள்விகள், பயண சுகாதார ஆலோசனை, அறிகுறி பகுப்பாய்வு மற்றும் பலவற்றில் நான் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?";
  };

  // Detect language from user's message
  const detectLanguage = (text: string): 'en' | 'ta' => {
    if (!text) return 'en';
    
    // Check for Tamil Unicode characters (Tamil script range: U+0B80 to U+0BFF)
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const hasTamil = tamilPattern.test(text);
    
    if (hasTamil) {
      console.log('🌐 Detected Tamil language from user message');
      return 'ta';
    }
    
    console.log('🌐 Detected English language from user message');
    return 'en';
  };

  // Fallback Gemini AI function
  const getGeminiResponse = async (message: string, imageData?: string): Promise<string> => {
    if (!geminiAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = geminiAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    
    // Detect language from user's message
    const detectedLang = detectLanguage(message);
    
    // Create health-focused prompt
    const healthPrompt = `You are MedGuide, a helpful AI health assistant. Please provide accurate, helpful health information while always reminding users to consult healthcare professionals for serious concerns. 

${imageData ? 'The user has shared a medical image. Please analyze it and provide insights.' : ''}

User message: ${message}

IMPORTANT: Respond in the SAME language as the user's message. The user wrote in ${detectedLang === 'en' ? 'English' : 'Tamil (தமிழ்)'}, so you MUST respond entirely in ${detectedLang === 'en' ? 'English' : 'Tamil'}. Keep your response informative but concise, and always include appropriate medical disclaimers.`;

    let result;
    if (imageData) {
      // For images, use vision model
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: imageData.split(';')[0].split(':')[1]
        }
      };
      result = await model.generateContent([healthPrompt, imagePart]);
    } else {
      result = await model.generateContent(healthPrompt);
    }
    
    const response = result.response;
    return response.text();
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: i18n.language === 'en' ? 'Invalid file' : 'தவறான கோப்பு',
          description: i18n.language === 'en' ? 'Please select an image file' : 'படக் கோப்பைத் தேர்ந்தெடுக்கவும்',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file size (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: i18n.language === 'en' ? 'File too large' : 'கோப்பு மிகப் பெரியது',
          description: i18n.language === 'en' ? 'Please select an image under 4MB' : '4MB க்கு குறைவான படத்தைத் தேர்ந்தெடுக்கவும்',
          variant: 'destructive'
        });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert image to base64
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if ((!messageToSend && !selectedImage) || isLoading) return;

    let imageData: string | undefined;
    if (selectedImage) {
      imageData = await imageToBase64(selectedImage);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend || (i18n.language === 'en' ? 'Please analyze this image' : 'இந்த படத்தை பகுப்பாய்வு செய்யவும்'),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: imagePreview || undefined,
      imageData: imageData
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Add to conversation history
    const newUserHistory = { role: 'user' as const, content: messageToSend };
    setConversationHistory(prev => [...prev, newUserHistory]);
    
    setInputMessage('');
    handleRemoveImage(); // Clear image after sending
    setIsLoading(true);

    try {
      let responseContent = '';
      
      // Detect language from user's message
      const detectedLang = detectLanguage(messageToSend);
      console.log(`🌐 User message language: ${detectedLang === 'en' ? 'English' : 'Tamil'}`);
      
      try {
        // First, try the backend API
        console.log('🔄 Trying backend API...');
        const response = await aiAPI.chat(messageToSend, {
          conversationHistory,
          language: detectedLang, // Use detected language from user's message
          userId: user?.id || 'anonymous',
          imageData: imageData
        });
        
        if (response.success && response.data) {
          responseContent = response.data.response;
          console.log('✅ Backend API successful');
        } else {
          throw new Error(response.message || 'Backend API failed');
        }
      } catch (backendError) {
        console.log('⚠️ Backend API failed, trying direct Gemini...', backendError);
        
        // Fallback to direct Gemini API
        responseContent = await getGeminiResponse(messageToSend, imageData);
        console.log('✅ Direct Gemini API successful');
        
        // Show a toast to inform user about fallback
        toast({
          title: i18n.language === 'en' ? 'Using Direct AI' : 'நேரடி AI பயன்படுத்துகிறது',
          description: i18n.language === 'en' ? 'Connected directly to Gemini AI' : 'நேரடியாக Gemini AI உடன் இணைக்கப்பட்டது',
        });
      }

      // Check if user is asking about clinics or has symptoms that need clinic suggestions
      const lowerMessage = messageToSend.toLowerCase();
      const clinicKeywords = ['clinic', 'hospital', 'doctor', 'medical', 'nearby', 'find', 'where', 'கிளினிக்', 'மருத்துவமனை', 'மருத்துவர்', 'அருகில்'];
      const symptomKeywords = ['pain', 'fever', 'headache', 'sick', 'hurt', 'ache', 'emergency', 'urgent', 'வலி', 'காய்ச்சல்', 'தலைவலி', 'நோய்', 'அவசரம்'];
      
      const isAskingForClinics = clinicKeywords.some(keyword => lowerMessage.includes(keyword));
      const hasSymptoms = symptomKeywords.some(keyword => lowerMessage.includes(keyword));
      
      if (isAskingForClinics || hasSymptoms) {
        try {
          console.log('🏥 Adding clinic suggestions...');
          const clinicSuggestions = await suggestNearbyClinics(messageToSend);
          responseContent += '\n\n' + clinicSuggestions;
        } catch (clinicError) {
          console.warn('⚠️ Failed to get clinic suggestions:', clinicError);
          // Don't fail the entire response, just add a note
          responseContent += '\n\n' + (i18n.language === 'en' 
            ? "💡 For nearby healthcare facilities, please enable location access or visit our Clinics page."
            : "💡 அருகிலுள்ள சுகாதார வசதிகளுக்கு, இருப்பிட அணுகலை இயக்கவும் அல்லது எங்கள் கிளினிக்குகள் பக்கத்தைப் பார்வையிடவும்.");
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Speak response if voice is enabled (in detected language)
      if (voiceEnabled) {
        // Remove markdown formatting for better speech
        const cleanText = responseContent
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1');
        
        // Speak in the detected language
        const voiceLang = detectLanguage(responseContent);
        speakTextInLanguage(cleanText, voiceLang);
      }
      
      // Add assistant response to conversation history
      const newBotHistory = { role: 'assistant' as const, content: responseContent };
      setConversationHistory(prev => [...prev, newBotHistory]);
      
    } catch (error) {
      console.error('❌ All AI methods failed:', error);
      
      // Provide helpful response based on the user's message
      let helpfulResponse = '';
      const lowerMessage = messageToSend.toLowerCase();
      
      if (lowerMessage.includes('headache') || lowerMessage.includes('தலைவலி')) {
        helpfulResponse = i18n.language === 'en' 
          ? `I understand you're experiencing a headache. Here are some general suggestions:

• **Rest**: Try to rest in a quiet, dark room
• **Hydration**: Drink plenty of water as dehydration can cause headaches
• **Cold/Heat therapy**: Apply a cold compress to your forehead or a warm compress to your neck
• **Over-the-counter pain relief**: Consider acetaminophen or ibuprofen (follow package directions)
• **Stress management**: Practice deep breathing or gentle stretching

**⚠️ Seek immediate medical attention if you experience:**
- Sudden, severe headache unlike any you've had before
- Headache with fever, stiff neck, confusion, or vision changes
- Headache after a head injury
- Headache that worsens despite treatment

**Please consult a healthcare professional if headaches persist or worsen.**`
          : `உங்களுக்கு தலைவலி இருப்பதை நான் புரிந்துகொள்கிறேன். இங்கே சில பொதுவான பரிந்துரைகள்:

• **ஓய்வு**: அமைதியான, இருண்ட அறையில் ஓய்வு எடுக்க முயற்சிக்கவும்
• **நீர்ச்சத்து**: நீரிழப்பு தலைவலியை ஏற்படுத்தும் என்பதால் நிறைய தண்ணீர் குடிக்கவும்
• **குளிர்/வெப்ப சிகிச்சை**: நெற்றியில் குளிர் ஒத்தடம் அல்லது கழுத்தில் வெப்ப ஒத்தடம் வைக்கவும்
• **மருந்து**: அசிட்டமினோஃபென் அல்லது இப்யூபுரூஃபென் (பேக்கேஜ் வழிமுறைகளைப் பின்பற்றவும்)
• **மன அழுத்த மேலாண்மை**: ஆழ்ந்த சுவாசம் அல்லது மென்மையான நீட்சி பயிற்சி செய்யவும்

**⚠️ உடனடி மருத்துவ கவனம் தேவை:**
- திடீர், கடுமையான தலைவலி
- காய்ச்சல், கழுத்து விறைப்பு, குழப்பம் அல்லது பார்வை மாற்றங்களுடன் தலைவலி
- தலையில் காயத்திற்குப் பிறகு தலைவலி
- சிகிச்சையின் போதும் மோசமாகும் தலைவலி

**தலைவலி தொடர்ந்தால் அல்லது மோசமானால் சுகாதார நிபுணரை அணுகவும்.**`;
      } else {
        helpfulResponse = i18n.language === 'en' 
          ? "I'm currently unable to connect to the AI service, but I'm here to help! For your health concern, I recommend consulting with a healthcare professional who can provide personalized advice. If this is urgent, please contact your doctor or call emergency services (108)."
          : "நான் தற்போது AI சேவையுடன் இணைக்க முடியவில்லை, ஆனால் உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன்! உங்கள் சுகாதார கவலைக்கு, தனிப்பயனாக்கப்பட்ட ஆலோசனை வழங்கக்கூடிய சுகாதார நிபுணரை அணுக பரிந்துரைக்கிறேன். இது அவசரமானால், உங்கள் மருத்துவரைத் தொடர்புகொள்ளவும் அல்லது அவசர சேவைகளை (108) அழைக்கவும்.";
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: helpfulResponse,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: i18n.language === 'en' ? 'Connection Issue' : 'இணைப்பு சிக்கல்',
        description: i18n.language === 'en' ? 'AI service temporarily unavailable, but I provided helpful information.' : 'AI சேவை தற்காலிகமாக கிடைக்கவில்லை, ஆனால் பயனுள்ள தகவல்களை வழங்கினேன்.',
        variant: 'default',
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

  const handleClearConversation = () => {
    startNewConversation();
    
    toast({
      title: i18n.language === 'en' ? 'New Chat Started' : 'புதிய உரையாடல் தொடங்கப்பட்டது',
      description: i18n.language === 'en' ? 'Previous chat saved in history' : 'முந்தைய உரையாடல் வரலாற்றில் சேமிக்கப்பட்டது',
    });
  };

  // Function to suggest nearby clinics based on symptoms
  const suggestNearbyClinics = async (symptoms: string): Promise<string> => {
    try {
      // Get symptom analysis
      const suggestions = clinicFinderService.suggestClinicsBySymptoms(symptoms, i18n.language as 'en' | 'ta');
      
      // Request fresh location permission to ensure we get the user's actual location
      console.log('📍 Requesting location permission for clinic search...');
      
      try {
        // Force a fresh location request (not cached)
        const { locationService } = await import('@/services/clinicServices');
        await locationService.getCurrentLocation();
      } catch (locError) {
        console.warn('⚠️ Location permission not granted:', locError);
        toast({
          title: i18n.language === 'en' ? 'Location Required' : 'இருப்பிடம் தேவை',
          description: i18n.language === 'en' 
            ? 'Please allow location access to find nearby clinics'
            : 'அருகிலுள்ள கிளினிக்குகளைக் கண்டுபிடிக்க இருப்பிட அணுகலை அனுமதிக்கவும்',
          variant: 'default'
        });
      }
      
      // Find nearby clinics based on current GPS location
      const clinics = await clinicFinderService.findNearbyClinics({
        maxDistance: 10000, // Increase to 10km radius for better results
        limit: 5,
        sortBy: 'distance'
      });

      let response = '';
      
      // Add urgency warning if needed
      if (suggestions.urgencyLevel === 'emergency') {
        response += i18n.language === 'en' 
          ? "🚨 **EMERGENCY**: This appears to be a medical emergency! Please call 108 or visit the nearest emergency room immediately.\n\n"
          : "🚨 **அவசரம்**: இது மருத்துவ அவசர நிலைமை போல் தெரிகிறது! உடனடியாக 108 ஐ அழைக்கவும் அல்லது அருகிலுள்ள அவசர சிகிச்சை பிரிவுக்குச் செல்லவும்.\n\n";
      } else if (suggestions.urgencyLevel === 'high') {
        response += i18n.language === 'en'
          ? "⚠️ **Important**: This requires prompt medical attention. Please seek care as soon as possible.\n\n"
          : "⚠️ **முக்கியம்**: இதற்கு உடனடி மருத்துவ கவனம் தேவை. முடிந்தவரை விரைவில் சிகிச்சை பெறவும்.\n\n";
      }

      // Add specialization recommendations
      if (suggestions.specializations.length > 0) {
        const specNames = suggestions.specializations.map(s => 
          i18n.language === 'ta' ? s.tamilName : s.name
        ).join(', ');
        
        response += i18n.language === 'en'
          ? `**Recommended Specialists**: ${specNames}\n\n`
          : `**பரிந்துரைக்கப்பட்ட நிபுணர்கள்**: ${specNames}\n\n`;
      }

      // Add nearby clinics
      if (clinics.length > 0) {
        response += i18n.language === 'en' 
          ? "**🏥 Nearby Healthcare Facilities:**\n\n"
          : "**🏥 அருகிலுள்ள சுகாதார வசதிகள்:**\n\n";

        clinics.forEach((clinic, index) => {
          const distance = clinic.distance ? `${clinic.distance.toFixed(1)}km` : 'Unknown distance';
          const rating = '⭐'.repeat(Math.floor(clinic.rating));
          const isOpen = clinicFinderService.isClinicOpen(clinic);
          const openStatus = isOpen 
            ? (i18n.language === 'en' ? '🟢 Open' : '🟢 திறந்துள்ளது')
            : (i18n.language === 'en' ? '🔴 Closed' : '🔴 மூடப்பட்டுள்ளது');

          response += `**${index + 1}. ${clinic.name}**\n`;
          response += `📍 ${clinic.address}\n`;
          response += `📏 ${distance} • ${rating} (${clinic.rating}/5) • ${openStatus}\n`;
          
          if (clinic.phone) {
            response += `📞 ${clinic.phone}\n`;
          }
          
          if (clinic.specializations.length > 0) {
            const specs = clinic.specializations.slice(0, 3).join(', ');
            response += `🩺 ${specs}\n`;
          }
          
          if (clinic.emergencyServices) {
            response += i18n.language === 'en' ? '🚨 Emergency Services Available\n' : '🚨 அவசர சேவைகள் கிடைக்கின்றன\n';
          }
          
          response += '\n';
        });

        // Add helpful tips
        response += i18n.language === 'en'
          ? "\n**💡 Tips:**\n• Call ahead to confirm availability\n• Bring your ID and any previous medical records\n• Consider the urgency of your condition when choosing\n"
          : "\n**💡 குறிப்புகள்:**\n• கிடைக்கும் தன்மையை உறுதிப்படுத்த முன்பே அழைக்கவும்\n• உங்கள் அடையாள அட்டை மற்றும் முந்தைய மருத்துவ பதிவுகளை கொண்டு வாருங்கள்\n• மருத்துவமனையைத் தேர்ந்தெடுக்கும்போது உங்கள் நிலையின் அவசரத்தை கருத்தில் கொள்ளுங்கள்\n";

      } else {
        response += i18n.language === 'en'
          ? "❌ **No nearby clinics found**\n\n**Possible reasons:**\n• 📍 Location access not granted - Please allow location permission in your browser\n• 🌍 No healthcare facilities within 10km radius\n• 🔌 Temporary API service issues\n\n**What to try:**\n1. Click the 🔒 icon in your browser's address bar\n2. Enable location access for this site\n3. Reload the page and try again\n4. Or visit the Clinics page to search manually\n\nFor emergencies, call **108** immediately."
          : "❌ **அருகிலுள்ள கிளினிக்குகள் கிடைக்கவில்லை**\n\n**சாத்தியமான காரணங்கள்:**\n• 📍 இருப்பிட அணுகல் வழங்கப்படவில்லை - உங்கள் உலாவியில் இருப்பிட அனுமதியை அனுமதிக்கவும்\n• 🌍 10 கிமீ சுற்றளவில் சுகாதார வசதிகள் இல்லை\n• 🔌 தற்காலிக API சேவை சிக்கல்கள்\n\n**முயற்சிக்க வேண்டியவை:**\n1. உங்கள் உலாவியின் முகவரி பட்டியில் 🔒 ஐகானைக் கிளிக் செய்யவும்\n2. இந்த தளத்திற்கான இருப்பிட அணுகலை இயக்கவும்\n3. பக்கத்தை மீண்டும் ஏற்றி மீண்டும் முயற்சிக்கவும்\n4. அல்லது கைமுறையாக தேட கிளினிக்குகள் பக்கத்தைப் பார்வையிடவும்\n\nஅவசரநிலைகளுக்கு, உடனடியாக **108** ஐ அழைக்கவும்.";
      }

      return response;

    } catch (error) {
      console.error('Error finding clinics:', error);
      return i18n.language === 'en'
        ? "I'm having trouble finding nearby clinics right now. Please try again later or contact your local healthcare provider directly. In case of emergency, call 108."
        : "தற்போது அருகிலுள்ள கிளினிக்குகளைக் கண்டுபிடிப்பதில் எனக்கு சிக்கல் உள்ளது. பின்னர் மீண்டும் முயற்சிக்கவும் அல்லது உங்கள் உள்ளூர் சுகாதார வழங்குநரை நேரடியாக தொடர்பு கொள்ளவும். அவசர நிலையில், 108 ஐ அழைக்கவும்.";
    }
  };



  return (
    <div className="fixed inset-0 top-16 flex bg-white dark:bg-gray-900 transition-colors">
      {/* Left Sidebar - ChatGPT Style */}
      <div className="w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col border-r border-gray-700">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-700">
          <Button 
            onClick={handleClearConversation}
            className="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-white justify-start rounded-md h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            {i18n.language === 'en' ? 'New chat' : 'புதிய உரையாடல்'}
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 text-sm p-4">
                {i18n.language === 'en' ? 'No conversations yet' : 'இதுவரை உரையாடல்கள் இல்லை'}
              </div>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className={`group p-3 rounded-lg cursor-pointer text-sm transition-colors flex items-center justify-between ${
                    conversation.id === currentConversationId
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{conversation.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-opacity flex-shrink-0"
                    title={i18n.language === 'en' ? 'Delete' : 'நீக்கு'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-700 space-y-2">
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-transparent hover:bg-gray-800 text-white justify-start rounded-md"
          >
            <Home className="w-4 h-4 mr-2" />
            {i18n.language === 'en' ? 'Dashboard' : 'டாஷ்போர்டு'}
          </Button>
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full bg-transparent hover:bg-gray-800 text-white justify-start rounded-md"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button
            onClick={toggleVoiceOutput}
            className="w-full bg-transparent hover:bg-gray-800 text-white justify-start rounded-md"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            {i18n.language === 'en' 
              ? (voiceEnabled ? 'Voice On' : 'Voice Off')
              : (voiceEnabled ? 'குரல் இயக்கம்' : 'குரல் முடக்கம்')}
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 1 && (
            /* Welcome Screen */
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-2xl">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  {i18n.language === 'en' ? 'How can I help you today?' : 'இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?'}
                </h1>
                
                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {[
                    { 
                      en: "I have a headache, what should I do?", 
                      ta: "எனக்கு தலைவலி இருக்கிறது, நான் என்ன செய்ய வேண்டும்?",
                      icon: "🤕"
                    },
                    { 
                      en: "What are the symptoms of flu?", 
                      ta: "காய்ச்சலின் அறிகுறிகள் என்ன?",
                      icon: "🤒"
                    },
                    { 
                      en: "Travel health tips for Japan", 
                      ta: "ஜப்பானுக்கான பயண சுகாதார குறிப்புகள்",
                      icon: "✈️"
                    },
                    { 
                      en: "Find nearby clinics and hospitals", 
                      ta: "அருகிலுள்ள கிளினிக்குகள் மற்றும் மருத்துவமனைகளைக் கண்டறியவும்",
                      icon: "🏥"
                    }
                  ].map((suggestion, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(i18n.language === 'en' ? suggestion.en : suggestion.ta)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-all duration-200 bg-white dark:bg-gray-800"
                    >
                      <div className="text-2xl mb-2">{suggestion.icon}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {i18n.language === 'en' ? suggestion.en : suggestion.ta}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.length > 1 && (
            <div className="pb-32">
              <AnimatePresence>
                {messages.slice(1).map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`w-full ${
                      message.role === "user" 
                        ? "bg-white dark:bg-gray-900" 
                        : "bg-gray-50 dark:bg-gray-800/50"
                    } border-b border-gray-100 dark:border-gray-800`}
                  >
                    <div className="max-w-3xl mx-auto px-6 py-8">
                      <div className="flex gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {message.role === "user" ? (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          {message.role === "assistant" ? (
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="text-gray-900 dark:text-gray-100 leading-7 mb-4 last:mb-0">
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="text-gray-900 dark:text-gray-100 list-disc pl-6 mb-4">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="text-gray-900 dark:text-gray-100 list-decimal pl-6 mb-4">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="mb-1">{children}</li>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-gray-900 dark:text-white">
                                      {children}
                                    </strong>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div>
                              {message.imageUrl && (
                                <div className="mb-3">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Uploaded medical image" 
                                    className="max-w-sm rounded-lg border border-gray-300 dark:border-gray-600"
                                  />
                                </div>
                              )}
                              <p className="text-gray-900 dark:text-gray-100 leading-7">
                                {message.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="max-w-3xl mx-auto px-6 py-8">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 bg-gradient-to-t from-white dark:from-gray-900 via-white dark:via-gray-900 to-transparent pt-6">
          <div className="max-w-3xl mx-auto px-6 pb-6">
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-xs max-h-40 rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={i18n.language === 'en' ? "Message MedGuide..." : "மெட்கைடுக்கு செய்தி அனுப்புங்கள்..."}
                className="w-full pr-20 py-4 px-4 border-0 bg-transparent focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className={`w-8 h-8 p-0 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={i18n.language === 'en' ? "Voice input" : "குரல் உள்ளீடு"}
                >
                  {isListening ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-white" />}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-8 h-8 p-0 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  title={i18n.language === 'en' ? "Upload image" : "படத்தை பதிவேற்றவும்"}
                >
                  <ImagePlus className="h-4 w-4 text-white" />
                </Button>
                <Button
                  onClick={() => handleSendMessage(i18n.language === 'en' ? "Find nearby clinics and hospitals" : "அருகிலுள்ள கிளினிக்குகள் மற்றும் மருத்துவமனைகளைக் கண்டறியவும்")}
                  disabled={isLoading}
                  className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  title={i18n.language === 'en' ? "Find nearby clinics" : "அருகிலுள்ள கிளினிக்குகள்"}
                >
                  <MapPin className="h-4 w-4 text-white" />
                </Button>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                  className="w-8 h-8 p-0 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white dark:text-gray-900" />
                  ) : (
                    <Send className="h-4 w-4 text-white dark:text-gray-900" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Disclaimer */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              {i18n.language === 'en' 
                ? 'MedGuide can make mistakes. Consider checking important information and consult healthcare professionals for medical decisions.'
                : 'மெட்கைட் தவறுகள் செய்யலாம். முக்கியமான தகவல்களை சரிபார்த்து மருத்துவ முடிவுகளுக்கு சுகாதார நிபுணர்களை அணுகவும்.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;