require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('📋 Listing available Gemini models...\n');
    
    // Try different API endpoints
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models?key=' + process.env.GEMINI_API_KEY);
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:');
      data.models.forEach(model => {
        if (model.name.includes('gemini')) {
          console.log(`  - ${model.name}`);
          console.log(`    Display Name: ${model.displayName}`);
          console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
          console.log('');
        }
      });
    } else {
      console.log('❌ Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
  }
}

listModels();
