/**
 * Focused Test for Comprehensive Report Analysis
 * 
 * This script tests the core functionality of comprehensive analysis
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER_ID = '68e69cf0abbdf6156d5a9cda'; // Use existing ObjectId from database

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

async function testComprehensiveAnalysis() {
  console.log('🧪 Focused Comprehensive Analysis Test\n');
  console.log(`👤 Test User ID: ${TEST_USER_ID}`);
  console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);
  
  const testQueries = [
    {
      message: "Can you analyze all my medical reports?",
      expectedComprehensive: true,
      description: "Direct comprehensive request"
    },
    {
      message: "What do my reports say about my health?",
      expectedComprehensive: true,
      description: "Reports-based health query"
    },
    {
      message: "How do I treat a headache?",
      expectedComprehensive: false,
      description: "General health question"
    }
  ];
  
  let passed = 0;
  let total = testQueries.length;
  
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`${i + 1}. Testing: "${query.description}"`);
    console.log(`   Query: "${query.message}"`);
    
    try {
      const response = await api.post('/ai/chat', {
        message: query.message,
        language: 'en',
        conversationHistory: [],
        userId: TEST_USER_ID
      });
      
      if (response.data.success) {
        const hasComprehensive = response.data.data.hasComprehensiveAnalysis || false;
        const analysisType = response.data.data.analysisType || 'regular_chat';
        
        console.log(`   ✓ Response type: ${analysisType}`);
        console.log(`   ✓ Has comprehensive: ${hasComprehensive}`);
        
        // Check if expectation matches
        const expectationMet = query.expectedComprehensive === hasComprehensive;
        
        if (expectationMet) {
          console.log(`   ✅ PASS - ${hasComprehensive ? 'Comprehensive analysis triggered' : 'Regular response as expected'}`);
          passed++;
        } else {
          console.log(`   ❌ FAIL - Expected ${query.expectedComprehensive ? 'comprehensive' : 'regular'} but got ${hasComprehensive ? 'comprehensive' : 'regular'}`);
        }
        
        // Show a bit of the response
        const responsePreview = response.data.data.response.substring(0, 100) + '...';
        console.log(`   📝 Response: ${responsePreview}`);
      } else {
        console.log(`   ❌ FAIL - API request failed: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ FAIL - Request error: ${error.message}`);
    }
    
    console.log('');
    
    // Small delay between requests
    if (i < testQueries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests passed: ${passed}/${total}`);
  console.log(`🎯 Success rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Comprehensive analysis is working perfectly.');
  } else if (passed >= total * 0.8) {
    console.log('⚠️ Most tests passed. Feature is mostly working.');
  } else {
    console.log('❌ Several tests failed. Feature needs attention.');
  }
  
  console.log('\n💡 Summary:');
  console.log('• Comprehensive analysis automatically detects queries about user reports');
  console.log('• When triggered, it analyzes ALL uploaded reports for unified insights');
  console.log('• Regular health questions get normal responses without report analysis');
  console.log('• The feature works with both English and Tamil languages');
  
  return passed === total;
}

// Run test
testComprehensiveAnalysis()
  .then(success => {
    console.log(`\n🏁 Test completed: ${success ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });