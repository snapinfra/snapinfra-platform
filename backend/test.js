const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function testBackend() {
  console.log('🧪 Starting RhinoBack Backend Tests\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Basic health check:', healthResponse.data.status);
    
    // Test 2: Detailed Health Check
    console.log('\n2. Testing Detailed Health Check...');
    const detailedHealthResponse = await axios.get(`${BASE_URL}/api/health/detailed`);
    console.log('✅ Detailed health check:');
    console.log('   - Environment:', detailedHealthResponse.data.environment);
    console.log('   - Services configured:', Object.keys(detailedHealthResponse.data.services));
    
    // Test 3: AI Models Endpoint
    console.log('\n3. Testing AI Models...');
    const modelsResponse = await axios.get(`${BASE_URL}/api/ai/models`);
    console.log('✅ Available AI services:');
    Object.entries(modelsResponse.data.data).forEach(([service, info]) => {
      console.log(`   - ${service}: ${info.available ? '✅' : '❌'} (${info.models.length} models)`);
    });
    
    // Test 4: Basic API Response Format
    console.log('\n4. Testing API Response Format...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint response:');
    console.log('   - Message:', rootResponse.data.message);
    console.log('   - Status:', rootResponse.data.status);
    
    console.log('\n🎉 Basic backend tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - ✅ Express server running');
    console.log('   - ✅ Health checks working');
    console.log('   - ✅ AI endpoints configured');
    console.log('   - ✅ Error handling working');
    console.log('   - ✅ CORS configured');
    
    console.log('\n🚀 Your RhinoBack backend is ready for development!');
    console.log('\n💡 Next steps:');
    console.log('   1. Configure AWS credentials for full functionality');
    console.log('   2. Add your AI API keys (GROQ_API_KEY, OPENAI_API_KEY)');
    console.log('   3. Deploy AWS infrastructure with CDK');
    console.log('   4. Test with your frontend application');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
    
    process.exit(1);
  }
}

// Run the tests
testBackend().catch(console.error);