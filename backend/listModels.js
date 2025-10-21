require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  console.log('Listing available Gemini models...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('API Key preview:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 15) + '...' : 'Not found');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('\n✅ Available models:');
    models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Failed to list models');
    console.log('Error:', error.message);
    console.log('Status:', error.status);
    
    // Try a simple direct API call instead
    console.log('\n🔄 Trying direct API call to test key...');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Direct API call successful!');
        console.log('Available models from direct call:');
        data.models?.forEach(model => {
          console.log(`- ${model.name}`);
        });
      } else {
        console.log(`❌ Direct API call failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (fetchError) {
      console.log('❌ Direct API call exception:', fetchError.message);
    }
  }
}

listModels();