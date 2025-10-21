require('dotenv').config();
const simpleGeminiService = require('./services/simpleGeminiService');

async function testGemini() {
  console.log('Testing Gemini API connection...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('API Key preview:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 15) + '...' : 'Not found');
  
  try {
    const result = await simpleGeminiService.testService();
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log('Message:', result.message);
      console.log('Response preview:', result.response.substring(0, 200) + '...');
    } else {
      console.log('❌ FAILED!');
      console.log('Error:', result.message);
    }
  } catch (error) {
    console.log('❌ EXCEPTION!');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testGemini();