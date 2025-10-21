/**
 * Debug script for Comprehensive Report Analysis
 * 
 * This script helps debug why comprehensive analysis isn't being triggered
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER_ID = '68e69cf0abbdf6156d5a9cda'; // Use existing ObjectId from database

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

async function debugChatEndpoint() {
  console.log('🔍 Debugging Chat Endpoint for Comprehensive Analysis\n');
  
  try {
    const testMessage = "Can you analyze all my medical reports?";
    console.log(`📤 Sending test message: "${testMessage}"`);
    
    const response = await api.post('/ai/chat', {
      message: testMessage,
      language: 'en',
      conversationHistory: [],
      userId: TEST_USER_ID
    });
    
    console.log('\n📊 Response Details:');
    console.log('Success:', response.data.success);
    console.log('Response keys:', Object.keys(response.data.data));
    
    if (response.data.data) {
      console.log('Response preview:', response.data.data.response?.substring(0, 200) + '...');
      console.log('Has comprehensive analysis:', response.data.data.hasComprehensiveAnalysis);
      console.log('Analysis type:', response.data.data.analysisType);
      console.log('Detected language:', response.data.data.detectedLanguage);
      console.log('Has medical context:', response.data.data.hasMedicalContext);
    }
    
  } catch (error) {
    console.error('❌ Chat endpoint error:', error.response?.data || error.message);
  }
}

async function debugBulkAnalysisEndpoint() {
  console.log('\n🔍 Debugging Bulk Analysis Endpoint\n');
  
  try {
    console.log(`📤 Testing direct bulk analysis endpoint`);
    
    const response = await api.post('/ai/analyze-all-reports', {
      query: 'Provide comprehensive health summary',
      language: 'en',
      userId: TEST_USER_ID
    });
    
    console.log('\n📊 Bulk Analysis Response:');
    console.log('Success:', response.data.success);
    if (response.data.success) {
      console.log('Response keys:', Object.keys(response.data.data));
      console.log('Analysis preview:', response.data.data.analysis?.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ Bulk analysis error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

async function checkReports() {
  console.log('\n🔍 Checking Available Reports\n');
  
  try {
    // Try to get reports through reports endpoint if it exists
    try {
      const reportsResponse = await api.get(`/reports?userId=${TEST_USER_ID}`);
      console.log('📋 Found reports via reports endpoint:', reportsResponse.data);
    } catch (e) {
      console.log('📋 Reports endpoint not accessible or no reports found');
    }
    
  } catch (error) {
    console.error('❌ Error checking reports:', error.message);
  }
}

async function runDebugTests() {
  console.log('🐛 Comprehensive Analysis Debug Session\n');
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`👤 Test User ID: ${TEST_USER_ID}\n`);
  
  // Test the chat endpoint to see what's happening
  await debugChatEndpoint();
  
  // Test the bulk analysis endpoint directly  
  await debugBulkAnalysisEndpoint();
  
  // Check if there are any reports available
  await checkReports();
  
  console.log('\n💡 Debug Analysis Complete');
  console.log('\nPossible Issues:');
  console.log('1. No reports found for test user (expected - test user likely has no reports)');
  console.log('2. Comprehensive analysis logic not triggering correctly');
  console.log('3. Keywords not being detected properly');
  console.log('4. Backend service configuration issues');
}

// Run debug session
runDebugTests()
  .then(() => {
    console.log('\n✅ Debug session completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug session failed:', error.message);
    process.exit(1);
  });