import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, MessageSquare, Trash2, Settings, Upload, History, Paperclip, Mic, MicOff, File, FileText, FileImage, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import MotionPage from "@/components/common/MotionPage";
import Navbar from "@/components/layout/Navbar";
import MedicalReportUpload from "@/components/MedicalReportUpload";
import ReportSelector from "@/components/ReportSelector";
import ClinicFinder from "@/components/ClinicFinder";
import BackendAIService from "@/services/backendAIService";
import reportsService from "@/services/reportsService";
import TamilVoiceService from "../services/TamilVoiceService";
import LocationService from "@/services/LocationService";
import ClinicFinderService from "@/services/ClinicFinderService";
import type { Clinic, MedicalSpecialization } from "@/services/ClinicFinderService";
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  lastActive: Date;
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

const ChatPage = () => {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const [aiService] = useState(() => new BackendAIService());
  
  // Chat sessions management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzingAllReports, setIsAnalyzingAllReports] = useState(false);
  const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [currentVoiceTranscript, setCurrentVoiceTranscript] = useState<string>('');
  const [voiceConfidence, setVoiceConfidence] = useState(0);
  const [currentVoiceLanguage, setCurrentVoiceLanguage] = useState('ta-IN');
  const [showFallbackSuggestion, setShowFallbackSuggestion] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tamilVoiceService] = useState(() => new TamilVoiceService());
  
  // Clinic Finder Services and State
  const [locationService] = useState(() => new LocationService());
  const [clinicFinderService] = useState(() => new ClinicFinderService(locationService));
  const [userLocation, setUserLocation] = useState<any>(null);
  const [showClinicFinder, setShowClinicFinder] = useState(false);
  const [clinicFinderData, setClinicFinderData] = useState<{
    clinics: Clinic[];
    specializations: MedicalSpecialization[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
  } | null>(null);
  const [isSearchingClinics, setIsSearchingClinics] = useState(false);
  
  // User Management Functions
  const generateUserId = (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createOrGetUser = (): UserProfile => {
    const existingUserId = localStorage.getItem('medguide_current_user_id');
    
    console.log('👤 User management:', { existingUserId });
    
    if (existingUserId) {
      const userData = localStorage.getItem(`medguide_user_${existingUserId}`);
      console.log('📄 Existing user data found:', !!userData);
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const loadedUser = {
            ...user,
            createdAt: new Date(user.createdAt),
            lastActive: new Date()
          };
          console.log('✅ Loaded existing user:', { id: loadedUser.id, name: loadedUser.name });
          return loadedUser;
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
        }
      }
    }
    
    // Create new user
    const newUser: UserProfile = {
      id: generateUserId(),
      name: i18n.language === 'en' ? 'Health Seeker' : 'சுகாதார தேடுபவர்',
      createdAt: new Date(),
      lastActive: new Date()
    };
    
    console.log('🆕 Creating new user:', { id: newUser.id, name: newUser.name });
    
    // Save user data
    localStorage.setItem('medguide_current_user_id', newUser.id);
    localStorage.setItem(`medguide_user_${newUser.id}`, JSON.stringify(newUser));
    
    return newUser;
  };

  const getUserStorageKey = (userId: string): string => {
    return `medguide_chat_sessions_${userId}`;
  };

  const getUserReportsKey = (userId: string): string => {
    return `medguide_reports_${userId}`;
  };

  // Debug utility to check localStorage contents
  const debugLocalStorage = () => {
    console.log('🗝 LocalStorage Contents:');
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('medguide')) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value ? value.length + ' chars' : 'null'}`);
    });
    
    return keys;
  };

  // Test function to manually update title - remove after debugging
  const testTitleUpdate = () => {
    if (currentSessionId) {
      console.log('🧪 Testing title update manually');
      updateSessionTitle(currentSessionId, 'Test Title Update', false, false);
    }
  };

  // Helper functions
  const getCurrentSession = (): ChatSession | undefined => {
    return chatSessions.find(session => session.id === currentSessionId);
  };

  /**
   * Initialize user location for clinic finding
   */
  const initializeLocation = async () => {
    try {
      if (!locationService.isSupported()) {
        console.log('📍 Geolocation not supported');
        return;
      }
      
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      console.log('📍 User location obtained for clinic finder');
    } catch (error) {
      console.log('⚠️ Could not get user location:', error);
    }
  };

  /**
   * Detect if user is asking for clinic recommendations
   */
  const isClinicRequest = (input: string): boolean => {
    const lowerMessage = input.toLowerCase();
    const clinicKeywords = [
      // English keywords
      'clinic', 'hospital', 'doctor', 'medical', 'nearby', 'near me', 
      'emergency', 'urgent care', 'find doctor', 'find clinic',
      'where can i', 'recommend', 'suggest', 'location', 'address',
      // Tamil keywords  
      'கிளினிக்', 'மருத்துவமனை', 'மருத்துவர்', 'அருகில்', 'எங்கே',
      'பரிந்துரை', 'அவசர', 'சிகிச்சை', 'மருத்துவ', 'இடம்'
    ];
    
    return clinicKeywords.some(keyword => lowerMessage.includes(keyword));
  };


  /**
   * Generate clinic recommendation message
   */
  const generateClinicRecommendationMessage = (clinicData: any): string => {
    const { clinics, specializations, urgencyLevel, recommendations } = clinicData;
    
    let message = '';
    
    // Add urgency alert if needed
    if (urgencyLevel === 'emergency') {
      message += i18n.language === 'en' 
        ? '🚨 **EMERGENCY ALERT** - This seems urgent! Please consider calling 108 immediately or visiting the nearest emergency room.\n\n'
        : '🚨 **அவசர எச்சரிக்கை** - இது அவசரமாகத் தெரிகிறது! உடனடியாக 108 ஐ அழைக்கவும் அல்லது அருகிலுள்ள அவசர சிகிச்சை பிரிவுக்குச் செல்லவும்.\n\n';
    }
    
    // Add AI recommendations
    if (recommendations.length > 0) {
      message += recommendations.join('\n') + '\n\n';
    }
    
    // Add clinic recommendations
    if (clinics.length > 0) {
      message += i18n.language === 'en' 
        ? `🏥 **I found ${clinics.length} nearby healthcare facilities for you:**\n\n`
        : `🏥 **உங்களுக்காக ${clinics.length} அருகிலுள்ள சுகாதார வசதிகளை கண்டேன்:**\n\n`;
        
      clinics.slice(0, 3).forEach((clinic: Clinic, index: number) => {
        message += `**${index + 1}. ${clinic.name}**\n`;
        message += `📍 ${clinic.address}${clinic.city ? `, ${clinic.city}` : ''}\n`;
        if (clinic.distance) {
          message += `📏 ${clinic.distance.toFixed(1)} km ${i18n.language === 'en' ? 'away' : 'தூரம்'}\n`;
        }
        if (clinic.phone) {
          message += `📞 ${clinic.phone}\n`;
        }
        message += `⭐ ${clinic.rating}/5 (${clinic.reviews} ${i18n.language === 'en' ? 'reviews' : 'மதிப்புரைகள்'})\n`;
        if (clinic.emergencyServices) {
          message += `🚨 ${i18n.language === 'en' ? 'Emergency services available' : 'அவசர சேவைகள் கிடைக்கும்'}\n`;
        }
        message += '\n';
      });
      
      if (clinics.length > 3) {
        message += i18n.language === 'en' 
          ? `✨ I found ${clinics.length - 3} more clinics! Click "View All Clinics" below to see the complete list with an interactive map.\n\n`
          : `✨ இன்னும் ${clinics.length - 3} கிளினிக்குகளை கண்டேன்! முழு பட்டியலையும் ஊடாடும் வரைபடத்துடன் பார்க்க கீழே "அனைத்து கிளினிக்குகளையும் பார்க்கவும்" என்பதைக் கிளிக் செய்யவும்.\n\n`;
      }
    } else {
      message += i18n.language === 'en'
        ? '😔 I couldn\'t find any nearby clinics at the moment. This might be due to location access or limited data in your area. You can try:\n\n• Enabling location services\n• Searching in the Clinics page manually\n• Contacting local emergency services (108)\n\n'
        : '😔 இந்த நேரத்தில் அருகிலுள்ள கிளினிக்குகளை என்னால் கண்டுபிடிக்க முடியவில்லை. இது இருப்பிட அணுகல் அல்லது உங்கள் பகுதியில் வரையறுக்கப்பட்ட தரவு காரணமாக இருக்கலாம். நீங்கள் முயற்சி செய்யலாம்:\n\n• இருப்பிட சேவைகளை இயக்குதல்\n• கிளினிக்குகள் பக்கத்தில் கைமுறையாக தேடுதல்\n• உள்ளூர் அவசர சேவைகளை (108) தொடர்பு கொள்ளுதல்\n\n';
    }
    
    // Add specialization info if available
    if (specializations && specializations.length > 0) {
      const specializationText = Array.isArray(specializations) && typeof specializations[0] === 'string'
        ? specializations.join(', ')
        : specializations.map(s => s.name || s).join(', ');
      
      message += i18n.language === 'en'
        ? `💡 **Based on your symptoms, you may need:** ${specializationText}\n\n`
        : `💡 **உங்கள் அறிகுறிகளின் அடிப்படையில், உங்களுக்கு தேவைப்படலாம்:** ${specializationText}\n\n`;
    }
    
    message += i18n.language === 'en'
      ? '💙 **Need help with directions or calling?** I can help you get directions or call any of these clinics directly!'
      : '💙 **திசைகள் அல்லது அழைப்பில் உதவி தேவையா?** இந்த கிளினிக்குகளில் ஏதேனும் ஒன்றிற்கு நேரடியாக திசைகளைப் பெற அல்லது அழைக்க நான் உங்களுக்கு உதவ முடியும்!';
    
    return message;
  };

  const getWelcomeMessage = (): Message => {
    const hasReports = uploadedReports.some(r => r.status === 'completed');
    let content;
    
    if (hasReports) {
      const reportCount = uploadedReports.filter(r => r.status === 'completed').length;
      content = i18n.language === 'en' 
        ? `🎉 WOW! Hello there, health champion! 🌟 I'm MedGuide, your SUPER-POWERED medical assistant, and I'm absolutely THRILLED to help you! ✨

🔥 I can see you've uploaded ${reportCount} amazing medical report${reportCount > 1 ? 's' : ''} - you're taking charge of your health like a TRUE HERO! 💪

🚀 I'm going to use this incredible information to give you the most PERSONALIZED and AWESOME health guidance ever! Let's embark on this fantastic health journey together! 

💫 What exciting health question can I help you with today? I'm here to make your wellness journey EXTRAORDINARY! 🌈`
        : `🎉 வாவ்! வணக்கம், சுகாதார வீரர்! 🌟 நான் மெட்கைட், உங்கள் சூப்பர்-பவர்ட் மருத்துவ உதவியாளர், உங்களுக்கு உதவ நான் மிகவும் உற்சாகமாக இருக்கிறேன்! ✨

🔥 நீங்கள் ${reportCount} அற்புதமான மருத்துவ அறிக்கை${reportCount > 1 ? 'கள்' : ''}களை பதிவேற்றியிருப்பதை என்னால் பார்க்க முடிகிறது - நீங்கள் ஒரு உண்மையான வீரர் போல உங்கள் ஆரோக்கியத்தை கட்டுப்படுத்துகிறீர்கள்! 💪

🚀 இந்த அற்புதமான தகவலை பயன்படுத்தி உங்களுக்கு மிகவும் தனிப்பட்ட மற்றும் அருமையான சுகாதார வழிகாட்டுதலை வழங்க போகிறேன்! இந்த அற்புதமான சுகாதார பயணத்தில் ஒன்றாக செல்வோம்!

💫 இன்று நான் உங்களுக்கு என்ன அற்புதமான சுகாதார கேள்வியில் உதவ முடியும்? உங்கள் ஆரோக்கிய பயணத்தை அசாதாரணமாக்க நான் இங்கே இருக்கிறேன்! 🌈`;
    } else {
      content = i18n.language === 'en'
        ? `🎉 HELLO THERE, AMAZING HUMAN! 🌟 Welcome to MedGuide - your INCREDIBLE health companion! ✨

💪 I'm here to make your wellness journey absolutely FANTASTIC! Whether you have questions about symptoms, need health advice, or want to understand medical information better - I've got you covered! 🚀

🔥 Ready to take charge of your health like the CHAMPION you are? Let's dive into some exciting health conversations! 

💫 What can I help make AWESOME for you today? 🌈 Ask me anything about health, wellness, or medical topics - I'm here to make it FUN and informative! 🎊`
        : `🎉 வணக்கம், அற்புதமான மனிதரே! 🌟 மெட்கைடுக்கு வரவேற்கிறோம் - உங்கள் அசாதாரண சுகாதார துணைவர்! ✨

💪 உங்கள் ஆரோக்கிய பயணத்தை முற்றிலும் அருமையாக மாற்ற நான் இங்கே இருக்கிறேன்! அறிகுறிகளைப் பற்றிய கேள்விகள், சுகாதார ஆலோசனை தேவை, அல்லது மருத்துவ தகவல்களை நன்றாக புரிந்து கொள்ள வேண்டும் - நான் உங்களுக்காக இருக்கிறேன்! 🚀

🔥 நீங்கள் ஒரு சாம்பியன் போல உங்கள் ஆரோக்கியத்தை கட்டுப்படுத்த தயாரா? சில அற்புதமான சுகாதார உரையாடல்களில் மூழ்குவோம்!

💫 இன்று உங்களுக்காக நான் எதை அருமையாக செய்ய முடியும்? 🌈 ஆரோக்கியம், ஆரோக்கியம் அல்லது மருத்துவ தலைப்புகளைப் பற்றி என்னிடம் எதையும் கேளுங்கள் - அதை வேடிக்கையாகவும் தகவலாகவும் மாற்ற நான் இங்கே இருக்கிறேன்! 🎊`;
    }

    return {
      id: 'welcome',
      role: 'assistant',
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
  };

  // Initialize user and load user-specific data on component mount
  useEffect(() => {
    const user = createOrGetUser();
    setCurrentUser(user);
    
    // Update user's last active time
    const updatedUser = { ...user, lastActive: new Date() };
    localStorage.setItem(`medguide_user_${user.id}`, JSON.stringify(updatedUser));
    
    // Load user-specific chat sessions
    const storageKey = getUserStorageKey(user.id);
    const savedSessions = localStorage.getItem(storageKey);
    
    console.log('📂 Loading chat sessions:', {
      userId: user.id,
      storageKey,
      savedDataExists: !!savedSessions,
      savedDataLength: savedSessions?.length || 0
    });
    
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }));
        
        console.log('📝 Loaded sessions:', sessions.map(s => ({ id: s.id, title: s.title, messageCount: s.messages.length })));
        setChatSessions(sessions);
        
        // Set the most recent session as current
        if (sessions.length > 0) {
          const mostRecent = sessions.sort((a: ChatSession, b: ChatSession) => 
            b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0];
          setCurrentSessionId(mostRecent.id);
          console.log('🎯 Set current session:', mostRecent.id);
        } else {
          // No saved sessions, create initial session
          console.log('🆕 No sessions found, creating initial session');
          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: i18n.language === 'en' ? 'New Chat' : 'புதிய உரையாடல்',
            messages: [getWelcomeMessage()],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setChatSessions([newSession]);
          setCurrentSessionId(newSession.id);
        }
      } catch (error) {
        console.error('❌ Error loading chat sessions:', error);
        // On error, create a new session
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: i18n.language === 'en' ? 'New Chat' : 'புதிய உரையாடல்',
          messages: [getWelcomeMessage()],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setChatSessions([newSession]);
        setCurrentSessionId(newSession.id);
      }
    } else {
      console.log('🆆 No saved sessions found for user, creating initial session');
      // No saved sessions, create initial session
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: i18n.language === 'en' ? 'New Chat' : 'புதிய உரையாடல்',
        messages: [getWelcomeMessage()],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setChatSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
    
    // Load user-specific reports
    const savedReports = localStorage.getItem(getUserReportsKey(user.id));
    if (savedReports) {
      try {
        const reports = JSON.parse(savedReports).map((report: any) => ({
          ...report,
          uploadDate: new Date(report.uploadDate)
        }));
        setUploadedReports(reports);
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }
    
    // Debug localStorage contents
    setTimeout(() => debugLocalStorage(), 1000);
    
    // Initialize location service for clinic finder
    initializeLocation();
    
    // Initialize Tamil-first voice service
    const initTamilVoiceService = async () => {
      try {
        console.log('🎤 Initializing Tamil-first voice service...');
        
        // Set user preference based on i18n (start with Tamil)
        const userLang = i18n.language === 'ta' ? 'ta-IN' : 'ta-IN'; // Always prefer Tamil first
        tamilVoiceService.setUserPreference(userLang);
        
        // Set up callbacks
        tamilVoiceService.setCallbacks({
          onStart: (data) => {
            setIsRecording(true);
            setRecordingError(null);
            setCurrentVoiceTranscript('');
            setCurrentVoiceLanguage(data.language);
            setShowFallbackSuggestion(false);
            console.log(`🎙️ Recording started in ${data.language}`);
          },
          
          onResult: (result) => {
            // Update current transcript with interim or final results
            const displayText = result.finalTranscript || result.interimTranscript || '';
            setCurrentVoiceTranscript(displayText);
            setVoiceConfidence(result.confidence || 0);
            setCurrentVoiceLanguage(result.language);
            
            if (result.finalTranscript) {
              console.log('📝 Voice input received:', result.finalTranscript, `(${result.language}, confidence: ${result.confidence?.toFixed(2)})`);
              
              // Add final transcript to input field
              setInput(prev => (prev + ' ' + result.finalTranscript).trim());
            }
          },
          
          onEnd: () => {
            setIsRecording(false);
            console.log('🔴 Recording ended');
            // Keep transcript visible briefly
            setTimeout(() => {
              setCurrentVoiceTranscript('');
            }, 2000);
          },
          
          onError: (error) => {
            console.error('🚫 Voice recording error:', error);
            setRecordingError(error.message || 'Voice recording failed');
            setIsRecording(false);
          },
          
          onFallbackSuggestion: (data) => {
            console.log('⚠️ Fallback suggestion:', data);
            setShowFallbackSuggestion(true);
            setFailureCount(data.failureCount || 0);
          },
          
          onLanguageSwitch: (data) => {
            console.log('🔄 Language switch:', data);
            setCurrentVoiceLanguage(data.to);
            setShowFallbackSuggestion(false);
          }
        });
        
        console.log('✅ Tamil voice service ready');
        
      } catch (error) {
        console.error('❌ Tamil voice service initialization failed:', error);
        setRecordingError('Voice recording not available in this browser');
      }
    };
    
    initTamilVoiceService();
  }, [i18n.language]);

  // Initial session creation is now handled in the main initialization useEffect above
  // This prevents timing issues with async state updates

  // Save chat sessions to user-specific localStorage whenever they change
  useEffect(() => {
    if (currentUser && chatSessions.length > 0) {
      const storageKey = getUserStorageKey(currentUser.id);
      console.log('💾 Saving chat sessions:', {
        userId: currentUser.id,
        storageKey,
        sessionCount: chatSessions.length,
        sessions: chatSessions.map(s => ({ id: s.id, title: s.title, messageCount: s.messages.length }))
      });
      localStorage.setItem(storageKey, JSON.stringify(chatSessions));
      
      // Verify it was saved
      const saved = localStorage.getItem(storageKey);
      console.log('✅ Verification - saved data exists:', !!saved);
    } else {
      console.log('⚠️ Not saving sessions:', { currentUser: !!currentUser, sessionCount: chatSessions.length });
    }
  }, [chatSessions, currentUser]);

  // Save reports to user-specific localStorage whenever they change
  useEffect(() => {
    if (currentUser && uploadedReports.length > 0) {
      localStorage.setItem(getUserReportsKey(currentUser.id), JSON.stringify(uploadedReports));
    }
  }, [uploadedReports, currentUser]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const currentSession = getCurrentSession();
    if (currentSession?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSessions, currentSessionId]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAttachMenu && !(event.target as Element).closest('.attachment-menu')) {
        setShowAttachMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: i18n.language === 'en' ? 'New Chat' : 'புதிய உரையாடல்',
      messages: [getWelcomeMessage()],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('🆕 Creating new session:', { id: newSession.id, title: newSession.title, messageCount: newSession.messages.length });
    
    setChatSessions(prev => {
      const updated = [newSession, ...prev];
      console.log('🔄 Updated sessions array:', updated.length);
      return updated;
    });
    setCurrentSessionId(newSession.id);
  };

  // Helper function to extract meaningful title from AI analysis
  const generateTitleFromAnalysis = (analysis: string, isImage: boolean): string => {
    // Common medical terms that might appear in analysis
    const medicalKeywords = {
      en: {
        conditions: ['diagnosis', 'condition', 'symptom', 'disease', 'disorder', 'infection', 'injury'],
        body_parts: ['skin', 'eye', 'heart', 'lung', 'brain', 'liver', 'kidney', 'blood', 'bone'],
        tests: ['x-ray', 'mri', 'ct scan', 'blood test', 'lab result', 'report'],
        general: ['medical', 'health', 'analysis', 'examination']
      },
      ta: {
        conditions: ['நோய்', 'அறிகுறி', 'உடல்நலம்', 'தோல்', 'கண்', 'இதயம்'],
        body_parts: ['தோல்', 'கண்', 'இதயம்', 'நுரையீரல்', 'மூளை', 'ரத்தம்'],
        tests: ['எக்ஸ்ரே', 'ஸ்கேன்', 'ரத்த பரிசோதனை', 'அறிக்கை'],
        general: ['மருத்துவ', 'ஆரோக்கியம்', 'பரிசீலனை']
      }
    };

    const lang = i18n.language === 'ta' ? 'ta' : 'en';
    const keywords = medicalKeywords[lang];
    
    // Clean the analysis text
    const cleanText = analysis.replace(/[🔍📄🖼️💡⚕️🏥]/g, '').trim();
    const sentences = cleanText.split(/[.!?]/).filter(s => s.trim().length > 10);
    
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      
      // Try to find a sentence with medical keywords
      for (const sentence of sentences.slice(0, 3)) {
        const lowerSentence = sentence.toLowerCase();
        const hasKeyword = [...keywords.conditions, ...keywords.body_parts, ...keywords.tests]
          .some(keyword => lowerSentence.includes(keyword.toLowerCase()));
        
        if (hasKeyword && sentence.trim().length > 15) {
          const title = sentence.trim().length > 50 
            ? sentence.trim().substring(0, 47) + '...'
            : sentence.trim();
          return title;
        }
      }
      
      // Fallback to first meaningful sentence
      const title = firstSentence.length > 50 
        ? firstSentence.substring(0, 47) + '...'
        : firstSentence;
      return title;
    }
    
    // Ultimate fallback
    return isImage 
      ? (lang === 'en' ? 'Image Analysis' : 'படப் பரிசீலனை')
      : (lang === 'en' ? 'Document Analysis' : 'ஆவண பரிசீலனை');
  };

  const updateSessionTitle = (sessionId: string, contentForTitle: string, isAnalysis: boolean = false, isImage: boolean = false) => {
    let title;
    
    if (isAnalysis) {
      title = generateTitleFromAnalysis(contentForTitle, isImage);
    } else {
      title = contentForTitle.length > 50 
        ? contentForTitle.substring(0, 47) + '...'
        : contentForTitle;
    }

    console.log('🔄 Updating session title:', { sessionId, title, isAnalysis, isImage });
      
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title, updatedAt: new Date() }
          : session
      )
    );
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => {
      const updated = prev.filter(session => session.id !== sessionId);
      
      // If we deleted the current session, switch to the most recent one
      if (sessionId === currentSessionId) {
        if (updated.length > 0) {
          setCurrentSessionId(updated[0].id);
        } else {
          // Create a new session if no sessions remain
          setTimeout(() => createNewSession(), 0);
        }
      }
      
      return updated;
    });
  };

  const addMessageToSession = (sessionId: string, message: Message) => {
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              messages: [...session.messages, message],
              updatedAt: new Date()
            }
          : session
      )
    );
  };

  /**
   * Search for nearby clinics based on user input
   */
  const searchNearbyClinics = async (userInput: string): Promise<any | null> => {
    try {
      if (!userLocation) {
        // Try to get current location
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation(location);
        } else {
          return null;
        }
      }

      // Analyze symptoms from user input to determine specialization
      const urgencyLevel = determineUrgencyLevel(userInput);
      const specializations = determineRequiredSpecializations(userInput);

      // Search for clinics
      const searchRadius = urgencyLevel === 'emergency' ? 10000 : 5000; // 10km for emergency, 5km otherwise
      
      const clinics = await clinicFinderService.findNearbyClinics({
        maxDistance: searchRadius,
        specialization: specializations.length > 0 ? specializations[0] : undefined,
        emergencyOnly: urgencyLevel === 'emergency',
        minRating: urgencyLevel === 'high' ? 4.0 : 3.5,
        sortBy: 'distance',
        limit: 10
      });

      const clinicData = {
        clinics: clinics.slice(0, 5), // Limit to top 5 results
        specializations,
        urgencyLevel,
        recommendations: generateRecommendations(userInput, urgencyLevel)
      };

      setClinicFinderData(clinicData);
      return clinicData;

    } catch (error) {
      console.error('Error searching for clinics:', error);
      return null;
    } finally {
      setIsSearchingClinics(false);
    }
  };

  /**
   * Determine urgency level from user input
   */
  const determineUrgencyLevel = (input: string): 'low' | 'medium' | 'high' | 'emergency' => {
    const emergencyKeywords = ['emergency', 'urgent', 'severe', 'chest pain', 'difficulty breathing', 'bleeding', 'unconscious', 'அவசரம்', 'கடுமையான'];
    const highUrgencyKeywords = ['pain', 'fever', 'infection', 'injury', 'நோவு', 'காய்ச்சல்'];
    
    const lowerInput = input.toLowerCase();
    
    if (emergencyKeywords.some(keyword => lowerInput.includes(keyword))) {
      return 'emergency';
    } else if (highUrgencyKeywords.some(keyword => lowerInput.includes(keyword))) {
      return 'high';
    } else if (lowerInput.includes('routine') || lowerInput.includes('checkup') || lowerInput.includes('வழக்கமான')) {
      return 'low';
    }
    
    return 'medium';
  };

  /**
   * Determine required medical specializations from user input
   */
  const determineRequiredSpecializations = (input: string): string[] => {
    const specializations: string[] = [];
    const lowerInput = input.toLowerCase();

    // Map symptoms/keywords to specializations
    if (lowerInput.includes('heart') || lowerInput.includes('chest') || lowerInput.includes('cardiac')) {
      specializations.push('cardiology');
    }
    if (lowerInput.includes('skin') || lowerInput.includes('rash') || lowerInput.includes('தோல்')) {
      specializations.push('dermatology');
    }
    if (lowerInput.includes('eye') || lowerInput.includes('vision') || lowerInput.includes('கண்')) {
      specializations.push('ophthalmology');
    }
    if (lowerInput.includes('bone') || lowerInput.includes('joint') || lowerInput.includes('fracture')) {
      specializations.push('orthopedics');
    }
    if (lowerInput.includes('child') || lowerInput.includes('pediatric') || lowerInput.includes('குழந்தை')) {
      specializations.push('pediatrics');
    }
    // Add more mappings as needed

    return specializations;
  };

  /**
   * Generate recommendations based on user input and urgency
   */
  const generateRecommendations = (input: string, urgencyLevel: string): string[] => {
    const recommendations: string[] = [];
    
    if (urgencyLevel === 'emergency') {
      recommendations.push(
        i18n.language === 'en' 
          ? 'Call emergency services (108) immediately if this is life-threatening'
          : 'உயிருக்கு ஆபத்தானால் உடனடியாக அவசர சேவைகளை (108) அழைக்கவும்'
      );
    }
    
    recommendations.push(
      i18n.language === 'en'
        ? 'Consider calling ahead to confirm availability and reduce wait time'
        : 'கிடைக்கும் தன்மையை உறுதிப்படுத்த முன்கூட்டியே அழைப்பதை கருத்தில் கொள்ளுங்கள்'
    );
    
    if (urgencyLevel !== 'emergency') {
      recommendations.push(
        i18n.language === 'en'
          ? 'Bring your medical history and current medications list'
          : 'உங்கள் மருத்துவ வரலாறு மற்றும் தற்போதைய மருந்துகள் பட்டியலை கொண்டு வாருங்கள்'
      );
    }
    
    return recommendations;
  };


  const handleReportSelection = async (reportId: string, reportName: string) => {
    if (!currentSessionId || isAnalyzingReport) return;
    
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    try {
      setIsAnalyzingReport(true);
      setIsTyping(true);
      
      // Add a user message indicating they selected a report
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: i18n.language === 'en' 
          ? `📋 Analyze my report: ${reportName}`
          : `📋 என் அறிக்கையை பகுப்பாய்வு செய்யுங்கள்: ${reportName}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      addMessageToSession(currentSessionId, userMessage);
      
      // Check if this session still has the default title
      const hasDefaultTitle = currentSession.title === 'New Chat' || currentSession.title === 'புதிய உரையாடல்';
      
      // Update session title if it's still default
      if (hasDefaultTitle) {
        const titleContent = i18n.language === 'en' 
          ? `Report Analysis: ${reportName}`
          : `அறிக்கை பகுப்பாய்வு: ${reportName}`;
        updateSessionTitle(currentSessionId, titleContent, false, false);
      }
      
      // Analyze the report
      const analysisResult = await reportsService.analyzeReport(
        reportId, 
        '', // No specific query, general analysis
        i18n.language,
        currentUser?.id
      );
      
      if (analysisResult.success && analysisResult.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: analysisResult.data.analysis,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        addMessageToSession(currentSessionId, aiMessage);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: i18n.language === 'en'
            ? `😔 I encountered an issue analyzing your report "${reportName}". ${analysisResult.error || 'Please try again or contact support if the issue persists.'}`
            : `😔 உங்கள் அறிக்கை "${reportName}" ஐ பகுப்பாய்வு செய்வதில் சிக்கல் ஏற்பட்டது. ${analysisResult.error || 'தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது சிக்கல் தொடர்ந்தால் ஆதரவைத் தொடர்புகொள்ளவும்.'}`
        };
        
        addMessageToSession(currentSessionId, errorMessage);
      }
      
    } catch (error) {
      console.error('Error analyzing report:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: i18n.language === 'en'
          ? `😔 I couldn't analyze your report "${reportName}" right now. Please try again later.`
          : `😔 இப்போது உங்கள் அறிக்கை "${reportName}" ஐ பகுப்பாய்வு செய்ய முடியவில்லை. தயவுசெய்து பின்னர் முயற்சிக்கவும்.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      addMessageToSession(currentSessionId, errorMessage);
    } finally {
      setIsAnalyzingReport(false);
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId) return;

    const inputText = input;
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    // Check if this session still has the default title (meaning no meaningful content yet)
    const hasDefaultTitle = currentSession.title === 'New Chat' || currentSession.title === 'புதிய உரையாடல்';
    const userMessages = currentSession.messages.filter(m => m.role === 'user');
    
    console.log('💬 Text input:', { 
      hasDefaultTitle, 
      currentTitle: currentSession.title,
      userCount: userMessages.length, 
      inputText,
      sessionId: currentSessionId,
      shouldUpdateTitle: hasDefaultTitle
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    addMessageToSession(currentSessionId, userMessage);
    
    // Update session title if it still has the default title
    if (hasDefaultTitle) {
      console.log('🏷️ Updating title because session has default title');
      updateSessionTitle(currentSessionId, inputText, false, false);
    }
    
    setInput("");
    setIsTyping(true);
    
    // Check if this warrants comprehensive analysis
    const mightNeedComprehensiveAnalysis = inputText.toLowerCase().includes('reports') || 
                                          inputText.toLowerCase().includes('history') ||
                                          inputText.toLowerCase().includes('overall') ||
                                          inputText.toLowerCase().includes('complete') ||
                                          inputText.toLowerCase().includes('all my') ||
                                          inputText.toLowerCase().includes('comprehensive');
    
    if (mightNeedComprehensiveAnalysis) {
      setIsAnalyzingAllReports(true);
    }

    try {
      // Detect language from user input
      console.log('🔍 Detecting language from user input:', inputText);
      const detectedLanguage = await aiService.detectLanguage(inputText);
      console.log(`🌐 Detected language: ${detectedLanguage}`);
      
      // Check if this is a clinic/hospital request
      const isRequestingClinic = isClinicRequest(inputText);
      
      let responseContent = '';
      
      if (isRequestingClinic) {
        console.log('🏥 Clinic request detected, searching for nearby clinics...');
        setIsSearchingClinics(true);
        
        // Search for nearby clinics
        const clinicData = await searchNearbyClinics(inputText);
        
        if (clinicData) {
          // Generate clinic recommendation message
          responseContent = generateClinicRecommendationMessage(clinicData);
          setShowClinicFinder(true); // Show the clinic finder component
        } else {
          responseContent = i18n.language === 'en'
            ? '🏥 I\'d love to help you find nearby clinics! However, I need access to your location to provide accurate recommendations. Please enable location services and try again, or visit our Clinics page to search manually.'
            : '🏥 அருகிலுள்ள கிளினிக்குகளைக் கண்டறிய நான் உங்களுக்கு உதவ விரும்புகிறேன்! இருப்பினும், துல்லியமான பரிந்துரைகளை வழங்க உங்கள் இருப்பிடத்திற்கு அணுகல் தேவை. இருப்பிட சேவைகளை இயக்கி மீண்டும் முயற்சிக்கவும், அல்லது கைமுறையாக தேட எங்கள் கிளினிக்குகள் பக்கத்திற்குச் செல்லவும்.';
        }
      } else {
        // Regular AI chat response
        // Get conversation history for context
        const conversationHistory = currentSession.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const aiResponse = await aiService.generateResponseWithContext(
          inputText, 
          conversationHistory, 
          detectedLanguage, // Use detected language instead of UI language
          currentUser?.id || 'anonymous'
        );
        
        responseContent = typeof aiResponse === 'string' ? aiResponse : aiResponse.response;
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      addMessageToSession(currentSessionId, assistantMessage);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t('chat:responses.error'),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      addMessageToSession(currentSessionId, errorMessage);
    } finally {
      setIsTyping(false);
      setIsAnalyzingAllReports(false);
    }
  };

  const handleClearAllHistory = () => {
    if (currentUser) {
      setChatSessions([]);
      localStorage.removeItem(getUserStorageKey(currentUser.id));
      createNewSession();
      setShowSettings(false);
    }
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

  const handleFileAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && aiService && currentSessionId) {
      const file = files[0];
      
      // Check if this session still has the default title
      const currentSession = getCurrentSession();
      const hasDefaultTitle = currentSession?.title === 'New Chat' || currentSession?.title === 'புதிய உரையாடல்';
      const userMessages = currentSession?.messages.filter(m => m.role === 'user') || [];
      
      // Create different messages for different file types
      const isImage = file.type.startsWith('image/');
      const fileMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: isImage 
          ? `🖼️ ${i18n.language === 'en' ? 'Shared an image:' : 'படத்தை பகிர்ந்து:'} ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
          : `📎 ${i18n.language === 'en' ? 'Attached document:' : 'ஆவணம் இணைக்கப்பட்டது:'} ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      console.log('📁 File attachment:', { 
        hasDefaultTitle, 
        currentTitle: currentSession?.title,
        fileType: isImage ? 'image' : 'document',
        shouldUpdateTitle: hasDefaultTitle
      });
      
      addMessageToSession(currentSessionId, fileMessage);
      setShowAttachMenu(false);
      setIsTyping(true);
      
      // Add processing message to show AI is analyzing
      const processingId = `${Date.now()}_processing`;
      const processingMessage: Message = {
        id: processingId,
        role: "assistant",
        content: isImage 
          ? (i18n.language === 'en' ? '🔍 Analyzing your image... I can see it and will provide medical insights shortly.' : '🔍 உங்கள் படத்தை பரிசீலிக்கிறேன்... எனால் அதை பார்க்க முடியும், சில நேரத்தில் மருத்துவ આராய்ச்சிகளை வழங்குவேன்.')
          : (i18n.language === 'en' ? '📄 Processing your document... I\'ll analyze the content and provide relevant information.' : '📄 உங்கள் ஆவணத்தை செயலாக்குகிறேன்... உள்ளடக்கத்தை பரிசீலித்து சந்தர்ப்பமான தகவல்களை வழங்குவேன்.'),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      addMessageToSession(currentSessionId, processingMessage);
      
      try {
        // Detect language preference (fallback to UI language if no recent user message)
        const recentUserMessages = currentSession?.messages
          .filter(m => m.role === 'user')
          .slice(-2) // Get last 2 user messages
          .map(m => m.content)
          .join(' ') || '';
        
        const languageToUse = recentUserMessages 
          ? await aiService.detectLanguage(recentUserMessages)
          : i18n.language as 'en' | 'ta';
        
        console.log('🌐 Using language for document analysis:', languageToUse);
        
        // Analyze the document/image using the AI service
        const analysis = await aiService.analyzeDocument(file, '', languageToUse);
        
        // Remove processing message and add actual analysis
        const updatedSession = getCurrentSession();
        if (updatedSession) {
          const updatedMessages = updatedSession.messages.filter(msg => msg.id !== processingId);
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: analysis,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          
          // Update the session with filtered messages plus the new analysis
          setChatSessions(prev => 
            prev.map(session => 
              session.id === currentSessionId 
                ? { ...session, messages: [...updatedMessages, botMessage], updatedAt: new Date() }
                : session
            )
          );
          
          // Update session title based on AI analysis if session has default title
          if (hasDefaultTitle) {
            console.log('🏷️ Setting title from analysis:', analysis.substring(0, 100));
            updateSessionTitle(currentSessionId, analysis, true, isImage);
          }
        }
      } catch (error) {
        console.error('Failed to analyze document:', error);
        
        // Remove processing message on error - get fresh session state
        const sessionForError = getCurrentSession();
        if (sessionForError) {
          const updatedMessages = sessionForError.messages.filter(msg => msg.id !== processingId);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: i18n.language === 'en' 
              ? 'Sorry, I had trouble analyzing this file. Please try again or describe what you see.' 
              : 'மன்னிக்கவும், இந்த கோப்பை பரிசீலிக்க எனக்கு சிரமம் இருந்தது. முறவும் முயற்சிக்கவும் அல்லது நீங்கள் என்ன பார்க்கிறீர்கள் என்பதை விவரிக்கவும்.',
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          
          // Update session with filtered messages plus error message
          setChatSessions(prev => 
            prev.map(session => 
              session.id === currentSessionId 
                ? { ...session, messages: [...updatedMessages, errorMessage], updatedAt: new Date() }
                : session
            )
          );
        }
      } finally {
        setIsTyping(false);
      }
    }
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAudioRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        console.log('🔴 Stopping voice recording...');
        const success = tamilVoiceService.stopRecording();
        
        if (success && currentVoiceTranscript && currentVoiceTranscript.trim() && currentSessionId) {
          const finalText = currentVoiceTranscript.trim();
            
          // Create a message with the transcribed text
          const audioMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: `🎤 ${currentVoiceLanguage === 'ta-IN' ? 'தமிழ் குரல் செய்தி:' : 'Voice message:'} "${finalText}"`
              + `\n\n${finalText}`, // Add the actual text
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          
          addMessageToSession(currentSessionId, audioMessage);
          
          // Update session title if it's still default
          const currentSession = getCurrentSession();
          if (currentSession && (currentSession.title === 'New Chat' || currentSession.title === 'புதிய உரையாடல்')) {
            const titleText = finalText.length > 30 ? finalText.substring(0, 27) + '...' : finalText;
            updateSessionTitle(currentSessionId, titleText, false, false);
          }
          
          // Optionally send immediately (uncomment to auto-send)
          // handleSend();
        }
        
      } else {
        // Start recording
        console.log('🎙️ Starting Tamil voice recording...');
        const started = await tamilVoiceService.startRecording();
        
        if (!started) {
          throw new Error('Failed to start recording');
        }
      }
    } catch (error) {
      console.error('❌ Voice recording error:', error);
      const errorMessage = error instanceof Error ? error.message : 
        (i18n.language === 'en' 
          ? 'Failed to start recording. Please check your microphone and try again.' 
          : 'பதிவைத் தொடங்குவதில் தோல்வி. உங்கள் மைக்ரோஃபோனை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.');
      
      setRecordingError(errorMessage);
      setIsRecording(false);
    }
  };

  const handleLanguageSwitch = (newLanguage: string) => {
    tamilVoiceService.switchLanguage(newLanguage);
    setCurrentVoiceLanguage(newLanguage);
    setShowFallbackSuggestion(false);
    setRecordingError(null);
    
    console.log(`✅ Switched to ${newLanguage}`);
  };

  const handleRetryTamil = () => {
    tamilVoiceService.resetFailureCount();
    tamilVoiceService.switchLanguage('ta-IN');
    setCurrentVoiceLanguage('ta-IN');
    setShowFallbackSuggestion(false);
    setRecordingError(null);
    
    console.log('✅ Retrying with Tamil');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
    setShowAttachMenu(false);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <FileImage className="w-4 h-4" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const medicalSummary = getMedicalSummary();
  const currentSession = getCurrentSession();

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Energetic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-cyan-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,0,128,0.15),transparent_50%)]" />
      </div>
      <Navbar />
      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* ChatGPT-style Sidebar */}
        <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 text-white flex flex-col overflow-hidden">
          {/* New Chat Button */}
          <div className="p-3">
            <Button 
              onClick={createNewSession} 
              className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {i18n.language === 'en' ? 'New chat' : 'நீயவ உரையாடல்'}
            </Button>
          </div>
          
          {/* Chat History */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 py-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    session.id === currentSessionId 
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/30 shadow-lg' 
                      : 'hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md'
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{session.title}</p>
                    <p className="text-xs text-gray-400">
                      {session.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              {chatSessions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {i18n.language === 'en' ? 'No conversations yet' : 'இன்னும் உரையாடல்கள் இல்லை'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Bottom Actions */}
          <div className="p-3 space-y-2 border-t border-white/10">
            {/* Upload Reports */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 rounded-xl">
                  <Upload className="w-4 h-4 mr-2" />
                  {i18n.language === 'en' ? 'Upload reports' : 'அறிக்கைகளை பதிவேற்றுக'}
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
            
            {/* Settings */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 rounded-xl">
                  <Settings className="w-4 h-4 mr-2" />
                  {i18n.language === 'en' ? 'Settings' : 'அமைப்புகள்'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{i18n.language === 'en' ? 'Chat Settings' : 'உரையாடல் அமைப்புகள்'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Button 
                    onClick={handleClearAllHistory}
                    variant="destructive"
                    className="w-full"
                  >
                    {i18n.language === 'en' ? 'Clear conversations' : 'உரையாடல்களை அழிக்கவும்'}
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
                  
                  <div className="text-xs text-muted-foreground">
                    <p><strong>{i18n.language === 'en' ? 'Total Sessions:' : 'மொத்த அமர்வுகள்:'}</strong> {chatSessions.length}</p>
                    <p><strong>{i18n.language === 'en' ? 'Storage:' : 'சேமிப்பு:'}</strong> {i18n.language === 'en' ? 'Local Browser Storage' : 'உள்ளூர் உலாவி சேமிப்பு'}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-sm overflow-hidden">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {currentSession?.messages.map((message) => (
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
                className={`p-4 max-w-[80%] backdrop-blur-xl border shadow-lg ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white border-purple-400/30 shadow-purple-500/25"
                    : "bg-white/10 text-white border-white/20 shadow-black/20"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className={`mt-1 text-[10px] ${message.role === "user" ? "text-white/70" : "text-white/60"}`}>
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
              <Card className="p-4 max-w-[80%] bg-white/10 backdrop-blur-xl border-white/20 text-white">
                {isAnalyzingAllReports ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-purple-300">
                        {i18n.language === 'en' ? '🔍 Analyzing all your reports...' : '🔍 உங்கள் அனைத்து அறிக்கைகளையும் பகுப்பாய்வு செய்கிறேன்...'}
                      </span>
                      <span className="text-xs text-white/60 mt-1">
                        {i18n.language === 'en' ? 'Creating comprehensive health insights' : 'விரிவான சுகாதார நுண்ணறிவுகளை உருவாக்குகிறேன்'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </Card>
            </div>
          )}
            </div>
          </ScrollArea>

          {/* Enhanced Input Area */}
          <div className="border-t border-white/10 p-4 bg-black/20 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto relative">
              
              {/* Report Selector */}
              <ReportSelector
                isVisible={showReportSelector}
                onClose={() => setShowReportSelector(false)}
                onSelectReport={handleReportSelection}
              />
              
              {/* Attachment Menu */}
              {showAttachMenu && (
                <div className="attachment-menu absolute bottom-16 left-0 bg-gray-900/95 backdrop-blur-xl border border-gray-600/80 rounded-xl p-2 shadow-2xl z-20">
                  <button
                    onClick={() => {
                      setShowReportSelector(true);
                      setShowAttachMenu(false);
                    }}
                    className="flex items-center space-x-3 w-full p-3 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="p-2 bg-gradient-to-r from-purple-500/80 to-violet-500/80 rounded-lg">
                      <FileText className="w-4 h-4 text-violet-200" />
                    </div>
                    <span className="font-medium">{i18n.language === 'en' ? 'Analyze Report' : 'அறிக்கையை பகுப்பாய்வு செய்க'}</span>
                  </button>
                  <button
                    onClick={openFileDialog}
                    className="flex items-center space-x-3 w-full p-3 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="p-2 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 rounded-lg">
                      <FileText className="w-4 h-4 text-cyan-200" />
                    </div>
                    <span className="font-medium">{i18n.language === 'en' ? 'Upload Document' : 'ஆவணத்தை பதிவேற்றுக'}</span>
                  </button>
                  <button
                    onClick={openFileDialog}
                    className="flex items-center space-x-3 w-full p-3 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="p-2 bg-gradient-to-r from-green-500/80 to-emerald-500/80 rounded-lg">
                      <FileImage className="w-4 h-4 text-emerald-200" />
                    </div>
                    <span className="font-medium">{i18n.language === 'en' ? 'Upload Image' : 'படத்தை பதிவேற்றுக'}</span>
                  </button>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                {/* Attach Button */}
                <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 rounded-xl text-cyan-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                {/* Input Field with Glass Effect */}
                <div className="flex-1 relative">
                  <Input
                    placeholder={
                      medicalSummary 
                        ? (i18n.language === 'en' ? "Ask about your health..." : "உங்கள் ஆரோக்கியத்தைப் பற்றி கேளுங்கள்...")
                        : (i18n.language === 'en' ? "Message MedGuide..." : "MedGuideக்கு செய்தி அனுப்புங்கள்...")
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-purple-400/50 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300 pr-16 py-3 rounded-xl"
                    disabled={isRecording}
                  />
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 max-w-[250px]">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="flex flex-col">
                        <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                          <span>{currentVoiceLanguage === 'ta-IN' ? '🇮🇳' : '🇺🇸'}</span>
                          {currentVoiceLanguage === 'ta-IN' 
                            ? 'தமிழில் பதிவு செய்யப்படுகிறது...'
                            : 'Recording in English...'}
                          {voiceConfidence > 0 && (
                            <span className={`ml-1 ${voiceConfidence > 0.6 ? 'text-green-400' : voiceConfidence > 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                              ({Math.round(voiceConfidence * 100)}%)
                            </span>
                          )}
                        </span>
                        {currentVoiceTranscript && (
                          <span className={`text-xs truncate ${
                            currentVoiceLanguage === 'ta-IN' ? 'text-orange-400' : 'text-green-400'
                          }`} title={`${currentVoiceLanguage} Recognition`}>
                            {currentVoiceLanguage === 'ta-IN' ? '🇮🇳' : '🇺🇸'} "{currentVoiceTranscript}"
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Language Toggle Button */}
                <button
                  onClick={() => {
                    const newLang = currentVoiceLanguage === 'ta-IN' ? 'en-IN' : 'ta-IN';
                    handleLanguageSwitch(newLang);
                  }}
                  className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-400/30 rounded-xl text-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                  title={currentVoiceLanguage === 'ta-IN' ? 'Switch to English' : 'Switch to Tamil'}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">
                      {currentVoiceLanguage === 'ta-IN' ? '🇮🇳' : '🇺🇸'}
                    </span>
                    <span className="text-xs">
                      {currentVoiceLanguage === 'ta-IN' ? 'TA' : 'EN'}
                    </span>
                  </div>
                </button>
                
                {/* Audio Button */}
                <button
                  onClick={handleAudioRecording}
                  className={`p-3 border rounded-xl transition-all duration-300 hover:scale-105 ${
                    isRecording 
                      ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 border-red-400/50 text-red-400 animate-pulse shadow-lg shadow-red-500/25' 
                      : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border-green-400/30 text-emerald-400 hover:shadow-lg hover:shadow-green-500/25'
                  }`}
                  title={currentVoiceLanguage === 'ta-IN' ? 'தமிழில் பதிவு செய்யுங்கள்' : 'Record in English'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                {/* Send Button */}
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isRecording}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500/50 disabled:to-gray-600/50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 disabled:hover:scale-100 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileAttachment}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
                multiple={false}
              />
            </div>
            <div className="text-center mt-2 max-w-4xl mx-auto space-y-1">
              {/* Voice Recording Error */}
              {recordingError && (
                <p className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
                  ⚠️ {recordingError}
                </p>
              )}
              
              {/* Voice Recording Hint */}
              {isRecording && (
                <p className="text-xs bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    🎤 
                    <span className={`font-bold ${
                      currentVoiceLanguage === 'ta-IN' ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {currentVoiceLanguage === 'ta-IN' ? '🇮🇳 தமிழ்' : '🇺🇸 English'} மோட்
                    </span>
                  </span>
                  <span className="text-cyan-300">
                    {currentVoiceLanguage === 'ta-IN'
                      ? 'தமிழில் தெளிவாக பேசுங்கள். மொழி மாற பொத்தானை அழுத்தவும்.'
                      : 'Speak clearly in English. Use the language button to switch to Tamil.'}
                  </span>
                </p>
              )}
              
              {/* Current Language Indicator (when not recording) */}
              {!isRecording && !recordingError && !showFallbackSuggestion && (
                <p className="text-xs text-white/60 flex items-center justify-center gap-2">
                  <span>🎤 குரல் மொழி:</span>
                  <span className={`font-bold ${
                    currentVoiceLanguage === 'ta-IN' ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {currentVoiceLanguage === 'ta-IN' ? '🇮🇳 தமிழ்' : '🇺🇸 English'}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-purple-400 hover:text-purple-300 cursor-pointer" 
                        onClick={() => {
                          const newLang = currentVoiceLanguage === 'ta-IN' ? 'en-IN' : 'ta-IN';
                          handleLanguageSwitch(newLang);
                        }}>
                    மாற அழுத்தவும் →
                  </span>
                </p>
              )}
              
              {/* Fallback Suggestion */}
              {showFallbackSuggestion && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 rounded-lg">
                  <div className="text-yellow-300 text-sm font-medium mb-2">
                    🔄 தமிழ் அடையாளம் கடினமாக உள்ளது ({failureCount} முயற்சிகள்)
                  </div>
                  <div className="text-yellow-200 text-xs mb-3">
                    சிறந்த தறத்திற்கு ஆங்கிலத்தில் பேசலாம் அல்லது தமிழில் மீண்டும் முயற்சிக்கலாம்.
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => handleLanguageSwitch('en-IN')}
                      className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 px-3 py-1 rounded text-xs transition-all"
                    >
                      🇺🇸 ஆங்கிலத்தில் மாறு
                    </button>
                    <button 
                      onClick={handleRetryTamil}
                      className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 text-orange-300 px-3 py-1 rounded text-xs transition-all"
                    >
                      🔄 தமிழில் மீண்டும் முயற்சி
                    </button>
                    <button 
                      onClick={() => setShowFallbackSuggestion(false)}
                      className="bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 text-gray-300 px-3 py-1 rounded text-xs transition-all"
                    >
                      ✖️ முடு
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-white/60">
                {medicalSummary && (
                  <span className="text-cyan-400 mr-2 font-medium">
                    ✨ {i18n.language === 'en' ? 'Enhanced with your medical data for personalized guidance' : 'தனிப்பாக்கப்பட்ட வழிகாட்டுதலுக்காக உங்கள் மருத்துவ தரவுடன் மேம்படுத்தப்பட்டது'} • 
                  </span>
                )}
                {i18n.language === 'en' 
                  ? 'MedGuide can make mistakes. Consider checking important information.' 
                  : 'MedGuide தவறுகளை செய்யலாம். முக்கியமான தகவல்களை சரிபார்க்கவும்.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Clinic Finder Modal */}
      {showClinicFinder && clinicFinderData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  {i18n.language === 'en' ? '🏥 Nearby Medical Facilities' : '🏥 அருகிலுள்ள மருத்துவ வசதிகள்'}
                </h2>
                <p className="text-white/60 text-sm">
                  {i18n.language === 'en' 
                    ? `Found ${clinicFinderData.clinics.length} facilities near you`
                    : `உங்களுக்கு அருகில் ${clinicFinderData.clinics.length} வசதிகள் கண்டுபிடிக்கப்பட்டன`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setShowClinicFinder(false);
                  setClinicFinderData(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              <ClinicFinder
                initialData={{
                  clinics: clinicFinderData.clinics,
                  loading: isSearchingClinics,
                  error: null,
                  location: userLocation
                }}
                onLocationError={() => {
                  console.log('Location error in clinic finder');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;