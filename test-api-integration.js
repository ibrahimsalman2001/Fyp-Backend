const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAPIs() {
  console.log('🧪 Testing API Integration...\n');

  try {
    // Test 1: Recent Videos
    console.log('1️⃣ Testing Recent Videos API...');
    const recentVideos = await axios.get(`${API_BASE}/videos-public/recent?limit=5`);
    console.log(`✅ Recent Videos: ${recentVideos.data.data.videos.length} videos found`);
    console.log(`   First video: ${recentVideos.data.data.videos[0]?.title || 'N/A'}\n`);

    // Test 2: Flagged Videos
    console.log('2️⃣ Testing Flagged Videos API...');
    const flaggedVideos = await axios.get(`${API_BASE}/videos-public/flagged`);
    console.log(`✅ Flagged Videos: ${flaggedVideos.data.data.videos.length} videos found`);
    if (flaggedVideos.data.data.videos.length > 0) {
      console.log(`   First flagged: ${flaggedVideos.data.data.videos[0]?.title || 'N/A'}\n`);
    } else {
      console.log(`   No flagged videos\n`);
    }

    // Test 3: Dashboard Analytics
    console.log('3️⃣ Testing Dashboard Analytics API...');
    const analytics = await axios.get(`${API_BASE}/analytics/dashboard`);
    const dashData = analytics.data.data;
    console.log(`✅ Dashboard Analytics:`);
    console.log(`   Total Watch Time: ${dashData.today?.totalWatchTime || 0} minutes`);
    console.log(`   Videos Watched: ${dashData.today?.videosWatched || 0}`);
    console.log(`   Productivity Score: ${dashData.today?.productivityScore || 0}%\n`);

    // Test 4: Mock Data Endpoint
    console.log('4️⃣ Testing Mock Data API...');
    const mockData = await axios.get(`${API_BASE}/mock-data/analytics`);
    console.log(`✅ Mock Data: ${mockData.data.success ? 'Available' : 'Not Available'}\n`);

    console.log('✨ All API tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Recent Videos: Working ✅`);
    console.log(`   - Flagged Videos: Working ✅`);
    console.log(`   - Dashboard Analytics: Working ✅`);
    console.log(`   - Mock Data: Working ✅`);
    console.log('\n🎉 Frontend can now connect to backend successfully!');

  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAPIs();

