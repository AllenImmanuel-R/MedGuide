# Vosk Speech Recognition Setup

This guide will help you set up Vosk models for speech recognition in both English and Tamil.

## Required Models

### English Model
- **Model**: `vosk-model-small-en-us-0.15` (40MB, recommended for web)
- **Download**: https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
- **Alternative**: `vosk-model-en-us-0.22` (1.8GB, higher accuracy)

### Tamil Support
Currently, there's no dedicated Tamil model for Vosk. The `vosk-model-us-en-0.22` you mentioned is actually an English model. For Tamil speech recognition, you have these options:

1. **Use Gemini's language detection**: The current implementation uses Gemini to detect Tamil text and can handle code-switching
2. **Wait for Tamil model**: Check https://alphacephei.com/vosk/models for future Tamil releases
3. **Train custom model**: Follow Vosk documentation to train your own Tamil model

## Setup Instructions

### 1. Download Models

```bash
# Create models directory in public folder
mkdir -p public/models

# Download English model (choose one)
cd public/models

# Option A: Small English model (faster loading)
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip

# Option B: Full English model (better accuracy)
wget https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip
unzip vosk-model-en-us-0.22.zip
```

### 2. Update Model Paths

Update the model paths in `src/services/voskService.ts`:

```typescript
getSupportedLanguages(): Array<{ code: string; name: string; modelPath: string }> {
  return [
    {
      code: 'en',
      name: 'English',
      modelPath: '/models/vosk-model-small-en-us-0.15', // or vosk-model-en-us-0.22
    },
    {
      code: 'ta',
      name: 'Tamil',
      modelPath: '/models/vosk-model-small-en-us-0.15', // Use English model for now
    },
  ];
}
```

### 3. Serve Models

Make sure your models are accessible via HTTP. The models should be in:
- `public/models/vosk-model-small-en-us-0.15/`
- `public/models/vosk-model-en-us-0.22/` (if using full model)

### 4. Browser Requirements

Ensure browsers support:
- WebAssembly
- Web Audio API
- MediaDevices API
- Microphone permissions

## Tamil Language Support

### Current Implementation
- **Text Input**: Full Tamil support via Gemini AI
- **Speech Input**: Uses English model but Gemini can process Tamil text
- **Mixed Language**: Handles code-switching between Tamil and English

### Future Enhancements
1. **Custom Tamil Model**: Train using Tamil speech data
2. **Hybrid Approach**: Use Web Speech API as fallback
3. **Cloud ASR**: Integrate with Google Speech-to-Text for Tamil

## Troubleshooting

### Model Loading Issues
- Check network connection and CORS settings
- Verify model files are properly extracted
- Ensure models are served over HTTPS in production

### Browser Compatibility
- Chrome: Full support
- Firefox: Good support
- Safari: Limited support
- Mobile: Varies by device

### Performance Optimization
- Use smaller models for faster loading
- Consider lazy loading models
- Implement model caching

## File Structure

```
public/
├── models/
│   ├── vosk-model-small-en-us-0.15/
│   │   ├── am/
│   │   ├── conf/
│   │   ├── graph/
│   │   └── ivector/
│   └── vosk-model-en-us-0.22/
│       ├── am/
│       ├── conf/
│       ├── graph/
│       └── ivector/
```

## Resources

- [Vosk Official Website](https://alphacephei.com/vosk/)
- [Vosk Models](https://alphacephei.com/vosk/models)
- [Vosk Browser Documentation](https://github.com/alphacep/vosk-browser)
- [Training Custom Models](https://alphacephei.com/vosk/training)