# Enhanced MedGuide AI Chatbot

This document describes the enhanced chatbot implementation with Gemini AI and Vosk speech recognition support.

## Features

### 🤖 Gemini AI Integration
- **Text Processing**: Advanced natural language understanding
- **Medical Context**: Specialized healthcare guidance prompts
- **Document Analysis**: Analyze uploaded medical documents and images
- **Language Detection**: Automatic detection of Tamil and English
- **Conversation Memory**: Maintains context across messages

### 🎤 Vosk Speech Recognition
- **Real-time Speech-to-Text**: Convert voice input to text
- **Multi-language Support**: English with Tamil fallback
- **Browser-based**: No external API calls for privacy
- **Noise Cancellation**: Built-in audio processing

### 🌐 Internationalization (i18n)
- **Tamil & English Support**: Full UI and content translation
- **Dynamic Language Switching**: Change language on the fly
- **Localized Medical Terminology**: Context-appropriate translations
- **RTL Support Ready**: Prepared for right-to-left languages

## Quick Setup

### 1. Environment Variables

Create a `.env` file with your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 2. Vosk Models (Optional)

For offline speech recognition, download Vosk models:

```bash
mkdir -p public/models
cd public/models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```

See [VOSK_SETUP.md](./VOSK_SETUP.md) for detailed instructions.

### 3. Run the Application

```bash
npm install
npm run dev
```

## Usage

### Text Chat
1. Click the floating chat bubble in the bottom-right corner
2. Type your health-related questions
3. Get AI-powered responses with medical context

### Voice Input
1. Click the microphone button in the chat input
2. Speak your question (English or Tamil)
3. Speech will be converted to text automatically
4. Submit to get AI response

### Language Switching
1. Use the language switcher (globe icon) above the chat bubble
2. Select Tamil (தமிழ்) or English
3. All UI elements will update immediately
4. AI responses will be in the selected language

### Document Analysis
1. Click the paperclip icon in the chat input
2. Upload medical documents or images (PDF, JPG, PNG)
3. AI will analyze and provide insights
4. Ask follow-up questions about the document

## Architecture

### Components

```
src/
├── components/
│   ├── common/
│   │   ├── EnhancedChatBubble.tsx    # Main chat interface
│   │   └── LanguageSwitcher.tsx      # Language selection
├── services/
│   ├── geminiService.ts              # Gemini AI integration
│   └── voskService.ts                # Speech recognition
├── i18n/
│   ├── index.ts                      # i18n configuration
│   └── locales/                      # Translation files
│       ├── en/                       # English translations
│       └── ta/                       # Tamil translations
```

### Service Layer

#### GeminiService
- Handles text generation and document analysis
- Maintains conversation context
- Provides language-specific prompts
- Error handling and fallbacks

#### VoskService
- Browser-based speech recognition
- Real-time audio processing
- Model management and switching
- Permission and compatibility checks

### Translation System
- **Namespace-based**: Organized by feature (chat, about, common)
- **Dynamic Loading**: Translations loaded on demand
- **Fallback Support**: English as fallback language
- **Context-aware**: Medical terminology properly translated

## Configuration

### Gemini Settings
```typescript
// In EnhancedChatBubble.tsx
const geminiService = new GeminiService({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: 'gemini-1.5-flash'  // or gemini-pro
});
```

### Vosk Configuration
```typescript
// In voskService.ts
getSupportedLanguages() {
  return [
    {
      code: 'en',
      name: 'English',
      modelPath: '/models/vosk-model-small-en-us-0.15'
    }
  ];
}
```

### i18n Settings
```typescript
// In src/i18n/index.ts
i18n.init({
  lng: 'en',              // Default language
  fallbackLng: 'en',      // Fallback language
  ns: ['common', 'chat', 'about'],  // Namespaces
  detection: {
    order: ['localStorage', 'navigator']
  }
});
```

## API Integration

### Gemini AI Features

#### Text Generation
```typescript
const response = await geminiService.generateResponse(
  userMessage, 
  currentLanguage
);
```

#### Document Analysis
```typescript
const analysis = await geminiService.analyzeDocument(
  file, 
  userQuery, 
  currentLanguage
);
```

#### Language Detection
```typescript
const detectedLang = await geminiService.detectLanguage(text);
```

### Error Handling
- **Network Failures**: Graceful fallbacks with user-friendly messages
- **API Limits**: Rate limiting awareness and user notification
- **Model Loading**: Progressive enhancement for Vosk functionality
- **Permission Issues**: Clear permission request flows

## Customization

### Adding New Languages

1. Create translation files:
```bash
src/i18n/locales/[lang]/
├── common.json
├── chat.json
└── about.json
```

2. Update language switcher:
```typescript
const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
];
```

3. Add medical context prompts in GeminiService

### Styling Customization

The chat bubble uses CSS custom properties and can be customized via:
- `src/components/styles/chatbubble.css`
- Tailwind utility classes
- CSS custom properties for themes

### Medical Specialization

Customize the system prompts in `geminiService.ts` for different medical specialties:
- Emergency care
- Mental health
- Pediatrics
- Chronic conditions

## Security & Privacy

### Data Protection
- **No Message Storage**: Conversations not permanently stored
- **Local Processing**: Vosk runs entirely in browser
- **API Security**: Gemini API key properly secured
- **File Analysis**: Images processed securely via Gemini Vision

### HIPAA Considerations
- Implement additional security measures for production
- Consider data encryption in transit and at rest
- Add user consent flows
- Implement audit logging

## Performance Optimization

### Lazy Loading
- Models loaded only when speech feature is used
- Translation files loaded on demand
- Components split for better bundle size

### Caching
- Vosk models cached in browser
- Translation files cached
- Gemini responses not cached (for privacy)

### Bundle Size
- Tree shaking for unused translations
- Dynamic imports for heavy components
- Optimized builds for production

## Browser Support

### Required Features
- **WebAssembly**: For Vosk speech recognition
- **Web Audio API**: For microphone access
- **ES2020+**: Modern JavaScript features
- **WebRTC**: For media device access

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ⚠️ Safari 14+ (limited Vosk support)
- ❌ Internet Explorer (not supported)

## Development

### Testing Speech Recognition
1. Use Chrome DevTools to simulate microphone input
2. Test with different audio qualities and accents
3. Verify language switching works correctly
4. Check error handling for permission denial

### Debugging
- Enable debug mode in i18n configuration
- Use browser console for Vosk initialization logs
- Check network tab for Gemini API calls
- Monitor WebRTC media device access

### Contributing
1. Follow existing code style and patterns
2. Add translations for new UI elements
3. Test across different browsers and devices
4. Update documentation for new features

## Limitations & Known Issues

### Vosk Limitations
- No dedicated Tamil model available
- Large model files (40MB-1.8GB)
- Browser compatibility varies
- Requires HTTPS in production

### Gemini Limitations
- API rate limits apply
- Internet connection required
- Token limits for long conversations
- Cost considerations for high usage

### General
- Medical advice disclaimer always shown
- Not a replacement for professional healthcare
- Regulatory compliance needed for production use

## Future Enhancements

### Planned Features
- [ ] Custom Tamil speech recognition model
- [ ] Offline mode with local AI models
- [ ] Integration with healthcare APIs
- [ ] Voice output (text-to-speech)
- [ ] Multi-modal interactions

### Research Areas
- Tamil language model training for Vosk
- Lightweight on-device AI models
- Advanced medical knowledge graphs
- Telemedicine integration possibilities

For detailed setup instructions, see [VOSK_SETUP.md](./VOSK_SETUP.md).