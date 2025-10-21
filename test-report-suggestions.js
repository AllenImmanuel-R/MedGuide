/**
 * Test script to verify that the chatbot suggests report analysis
 * when users mention their medical history or reports
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
const TEST_USER_ID = 'test_user_report_suggestions';

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

console.log('🧪 Testing Report Analysis Suggestions\n');

// Test queries that should trigger report analysis suggestions
const testQueries = [
  {
    message: "Can you tell me what might be the reason based on my previous reports",
    language: "en",
    expectedKeywords: ["attachment", "analyze report", "tip", "click"]
  },
  {
    message: "Based on my medical history, what could this headache mean?",
    language: "en", 
    expectedKeywords: ["attachment", "analyze report", "medical reports", "personalized"]
  },
  {
    message: "Look at my uploaded reports and tell me about my health",
    language: "en",
    expectedKeywords: ["attachment", "analyze report", "tip"]
  },
  {
    message: "என் முந்தைய அறிக்கைகளின் அடிப்படையில் என்ன காரணமாக இருக்கலாம்",
    language: "ta",
    expectedKeywords: ["இணைப்பு", "அறிக்கையை பகுப்பாய்வு", "குறிப்பு"]
  }
];

async function testReportSuggestion(query) {
  try {
    console.log(`💬 Testing: "${query.message.substring(0, 50)}..."`);
    console.log(`   Language: ${query.language}`);
    
    const response = await api.post('/ai/chat', {
      message: query.message,
      language: query.language,
      conversationHistory: [],
      userId: TEST_USER_ID
    });
    
    if (response.data.success) {
      const aiResponse = response.data.data.response;
      console.log(`🤖 AI Response (first 200 chars): ${aiResponse.substring(0, 200)}...`);
      
      // Check if the response contains expected keywords
      const foundKeywords = query.expectedKeywords.filter(keyword => 
        aiResponse.toLowerCase().includes(keyword.toLowerCase())
      );
      
      const suggestionFound = foundKeywords.length > 0;
      
      console.log(`✅ Suggestion keywords found: ${foundKeywords.join(', ')}`);
      console.log(`📊 Result: ${suggestionFound ? 'PASS' : 'FAIL'} - ${suggestionFound ? 'Report analysis suggested' : 'No report analysis suggestion'}`);
      console.log('---');
      
      return suggestionFound;
    } else {
      console.log('❌ Chat request failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runReportSuggestionTests() {
  console.log(`🏥 Testing Report Analysis Suggestion Feature\n`);
  console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);
  
  const results = [];
  
  for (const query of testQueries) {
    const result = await testReportSuggestion(query);
    results.push(result);
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  const passCount = results.filter(Boolean).length;
  const totalCount = results.length;
  
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Report suggestion tests passed: ${passCount}/${totalCount}`);
  
  if (passCount === totalCount) {
    console.log('🎉 All tests passed! The chatbot correctly suggests report analysis when users mention their medical history.');
  } else if (passCount >= totalCount * 0.75) {
    console.log('⚠️ Most tests passed. Some fine-tuning may be needed.');
  } else {
    console.log('❌ Several tests failed. The report suggestion feature may need improvement.');
  }
  
  console.log('\n💡 Feature Explanation:');
  console.log('When users mention:');
  console.log('• "previous reports"');
  console.log('• "my reports"'); 
  console.log('• "based on my history"');
  console.log('• "medical history"');
  console.log('• "uploaded reports"');
  console.log('The chatbot should suggest using the "Analyze Report" feature.');
  
  console.log('\n🎯 Expected User Experience:');
  console.log('1. User asks about their medical history');
  console.log('2. Chatbot suggests: "Click attachment → Analyze Report"');
  console.log('3. User clicks attachment button');
  console.log('4. User selects "Analyze Report" option');
  console.log('5. User chooses specific report for AI analysis');
  console.log('6. User gets personalized health insights');
  
  return passCount === totalCount;
}

// Run tests
runReportSuggestionTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });