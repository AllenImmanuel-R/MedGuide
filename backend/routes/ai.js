const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Analyze medical report
// @route   POST /api/v1/ai/analyze
// @access  Private
router.post('/analyze', async (req, res) => {
  try {
    const { reportData, reportType } = req.body;

    // Mock AI analysis
    const analysis = {
      id: Date.now().toString(),
      reportType: reportType || 'blood',
      summary: 'Your blood test results show normal values across all parameters.',
      findings: [
        {
          parameter: 'Hemoglobin',
          value: '14.2 g/dL',
          status: 'Normal',
          reference: '12-16 g/dL'
        },
        {
          parameter: 'White Blood Cells',
          value: '7.5 K/μL',
          status: 'Normal',
          reference: '4.5-11.0 K/μL'
        }
      ],
      recommendations: [
        'Continue with your current diet and exercise routine',
        'Schedule a follow-up in 6 months'
      ],
      riskLevel: 'Low',
      confidence: 0.95,
      analyzedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Chat with AI assistant
// @route   POST /api/v1/ai/chat
// @access  Private
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const imageData = context?.imageData;

    if (!message && !imageData) {
      return res.status(400).json({
        success: false,
        message: 'Message or image is required'
      });
    }

    // Get the generative model (use gemini-2.5-flash for best performance)
    const modelName = "models/gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create health-focused prompt
    const language = context?.language || 'en';
    const conversationHistory = context?.conversationHistory || [];
    
    let prompt = `You are MedGuide, a helpful AI health assistant. Please provide accurate, helpful health information while always reminding users to consult healthcare professionals for serious concerns.

Guidelines:
- Provide helpful, accurate health information
- Always include appropriate medical disclaimers
- Be empathetic and supportive
- Suggest when to seek professional medical help
- Keep responses informative but concise
- IMPORTANT: Respond in the SAME language as the user's question. The user is asking in ${language === 'en' ? 'English' : 'Tamil (தமிழ்)'}, so you MUST respond ENTIRELY in ${language === 'en' ? 'English' : 'Tamil'}.
${imageData ? '- Analyze the medical image provided and give detailed insights\n- Identify any visible conditions, symptoms, or abnormalities\n- Provide recommendations based on the image analysis' : ''}

`;

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      prompt += "Previous conversation:\n";
      conversationHistory.slice(-4).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += "\n";
    }

    if (message) {
      prompt += `Current user message: ${message}\n`;
    }
    
    if (imageData) {
      prompt += `\nThe user has shared a medical image. Please analyze it carefully and provide detailed health insights.`;
    }
    
    prompt += `\n\nPlease provide a helpful response:`;

    // Generate response
    let result;
    if (imageData) {
      // For images, include the image data
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1], // Remove data:image/...;base64, prefix
          mimeType: imageData.split(';')[0].split(':')[1]
        }
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }
    
    const aiResponse = await result.response;
    const responseText = aiResponse.text();

    const response = {
      id: Date.now().toString(),
      message: message,
      response: responseText,
      context: context || {},
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Get context from request body
    const { message, context } = req.body;
    
    // Provide intelligent fallback response based on message content
    let fallbackResponse = '';
    const lowerMessage = message?.toLowerCase() || '';
    const isEnglish = context?.language === 'en';
    
    if (lowerMessage.includes('headache') || lowerMessage.includes('தலைவலி')) {
      fallbackResponse = isEnglish 
        ? `I understand you're experiencing a headache. Here are some general suggestions:

• **Rest**: Try to rest in a quiet, dark room
• **Hydration**: Drink plenty of water as dehydration can cause headaches
• **Cold/Heat therapy**: Apply a cold compress to your forehead or a warm compress to your neck
• **Over-the-counter pain relief**: Consider acetaminophen or ibuprofen (follow package directions)

**⚠️ Seek immediate medical attention if you experience:**
- Sudden, severe headache unlike any you've had before
- Headache with fever, stiff neck, confusion, or vision changes
- Headache after a head injury

**Please consult a healthcare professional if headaches persist or worsen.**`
        : `உங்களுக்கு தலைவலி இருப்பதை நான் புரிந்துகொள்கிறேன். இங்கே சில பொதுவான பரிந்துரைகள்:

• **ஓய்வு**: அமைதியான, இருண்ட அறையில் ஓய்வு எடுக்க முயற்சிக்கவும்
• **நீர்ச்சத்து**: நீரிழப்பு தலைவலியை ஏற்படுத்தும் என்பதால் நிறைய தண்ணீர் குடிக்கவும்
• **குளிர்/வெப்ப சிகிச்சை**: நெற்றியில் குளிர் ஒத்தடம் அல்லது கழுத்தில் வெப்ப ஒத்தடம் வைக்கவும்
• **மருந்து**: அசிட்டமினோஃபென் அல்லது இப்யூபுரூஃபென் (பேக்கேஜ் வழிமுறைகளைப் பின்பற்றவும்)

**⚠️ உடனடி மருத்துவ கவனம் தேவை:**
- திடீர், கடுமையான தலைவலி
- காய்ச்சல், கழுத்து விறைப்பு, குழப்பம் அல்லது பார்வை மாற்றங்களுடன் தலைவலி

**தலைவலி தொடர்ந்தால் சுகாதார நிபுணரை அணுகவும்.**`;
    } else if (lowerMessage.includes('fever') || lowerMessage.includes('காய்ச்சல்')) {
      fallbackResponse = isEnglish
        ? `For fever management, here are some general guidelines:

• **Rest**: Get plenty of rest to help your body fight infection
• **Hydration**: Drink lots of fluids (water, clear broths, herbal teas)
• **Temperature control**: Use light clothing and keep room temperature comfortable
• **Medication**: Consider fever reducers like acetaminophen or ibuprofen
• **Cool compress**: Apply to forehead or wrists

**Seek medical attention if:**
- Fever above 103°F (39.4°C)
- Fever lasting more than 3 days
- Difficulty breathing or chest pain
- Severe headache or neck stiffness

**Always consult healthcare professionals for persistent symptoms.**`
        : `காய்ச்சல் மேலாண்மைக்கு, இங்கே சில பொதுவான வழிகாட்டுதல்கள்:

• **ஓய்வு**: தொற்றுநோயை எதிர்த்துப் போராட உங்கள் உடலுக்கு உதவ நிறைய ஓய்வு எடுக்கவும்
• **நீர்ச்சத்து**: நிறைய திரவங்கள் குடிக்கவும் (தண்ணீர், தெளிவான குழம்பு, மூலிகை தேநீர்)
• **வெப்பநிலை கட்டுப்பாடு**: இலகுவான ஆடைகளைப் பயன்படுத்தி அறை வெப்பநிலையை வசதியாக வைக்கவும்
• **மருந்து**: அசிட்டமினோஃபென் அல்லது இப்யூபுரூஃபென் போன்ற காய்ச்சல் குறைப்பான்களைக் கருத்தில் கொள்ளுங்கள்

**மருத்துவ கவனம் தேவை:**
- 103°F (39.4°C) க்கு மேல் காய்ச்சல்
- 3 நாட்களுக்கு மேல் நீடிக்கும் காய்ச்சல்

**தொடர்ந்த அறிகுறிகளுக்கு எப்போதும் சுகாதார நிபுணர்களை அணுகவும்.**`;
    } else {
      fallbackResponse = isEnglish
        ? `I'm here to help with your health questions! While I'm currently experiencing some technical difficulties with my AI system, I can still provide general health guidance.

For your specific concern, I recommend:
• Consulting with a healthcare professional for personalized advice
• Calling your doctor if symptoms are concerning
• Seeking immediate medical attention for emergencies (call 108)

**Common health tips:**
• Stay hydrated by drinking plenty of water
• Get adequate rest and sleep
• Maintain a balanced diet
• Exercise regularly as appropriate for your condition

**Is this urgent?** If you're experiencing severe symptoms, don't wait - contact emergency services immediately.

How else can I help you with general health information?`
        : `உங்கள் சுகாதார கேள்விகளுக்கு உதவ நான் இங்கே இருக்கிறேன்! நான் தற்போது என் AI அமைப்பில் சில தொழில்நுட்ப சிக்கல்களை எதிர்கொண்டாலும், பொதுவான சுகாதார வழிகாட்டுதலை இன்னும் வழங்க முடியும்.

உங்கள் குறிப்பிட்ட கவலைக்கு, நான் பரிந்துரைக்கிறேன்:
• தனிப்பயனாக்கப்பட்ட ஆலோசனைக்கு சுகாதார நிபுணரை அணுகவும்
• அறிகுறிகள் கவலைக்குரியதாக இருந்தால் உங்கள் மருத்துவரை அழைக்கவும்
• அவசரநிலைகளுக்கு உடனடி மருத்துவ கவனம் தேடவும் (108 ஐ அழைக்கவும்)

**பொதுவான சுகாதார குறிப்புகள்:**
• நிறைய தண்ணீர் குடித்து நீர்ச்சத்துடன் இருங்கள்
• போதுமான ஓய்வு மற்றும் தூக்கம் பெறுங்கள்
• சமச்சீர் உணவை பராமரிக்கவும்

பொதுவான சுகாதார தகவல்களில் வேறு எப்படி உதவ முடியும்?`;
    }

    res.status(200).json({
      success: true,
      data: {
        id: Date.now().toString(),
        message: message || 'Unknown message',
        response: fallbackResponse,
        context: context || {},
        timestamp: new Date().toISOString()
      }
    });
  }
});

// @desc    Get AI suggestions
// @route   GET /api/v1/ai/suggestions
// @access  Private
router.get('/suggestions', async (req, res) => {
  try {
    // Mock suggestions
    const suggestions = [
      {
        id: '1',
        title: 'Schedule Regular Checkups',
        description: 'Based on your age and health profile, consider scheduling regular checkups every 6 months.',
        priority: 'high',
        category: 'preventive'
      },
      {
        id: '2',
        title: 'Monitor Blood Pressure',
        description: 'Keep track of your blood pressure readings and share them with your healthcare provider.',
        priority: 'medium',
        category: 'monitoring'
      }
    ];

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
