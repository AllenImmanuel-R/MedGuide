require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('🔑 Testing Gemini API Key...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in .env file');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    console.log('\n📝 Test 1: Simple question...');
    const result1 = await model.generateContent('What is 2+2? Answer in one word.');
    const response1 = await result1.response;
    console.log('Response:', response1.text());

    console.log('\n📝 Test 2: Different question...');
    const result2 = await model.generateContent('What is the capital of France? Answer in one word.');
    const response2 = await result2.response;
    console.log('Response:', response2.text());

    console.log('\n✅ Gemini API is working correctly! Responses are different.');
    
  } catch (error) {
    console.error('\n❌ Gemini API Error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('💡 The API key is invalid. Please check your .env file.');
    }
  }
}

testGemini();
