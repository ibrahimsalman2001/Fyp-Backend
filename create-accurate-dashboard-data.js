const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Video = require('./src/models/Video');
const WatchHistory = require('./src/models/WatchHistory');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAccurateDashboardData() {
  try {
    console.log('🔄 Creating accurate dashboard data...\n');

    // Get test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Clear existing watch history
    await WatchHistory.deleteMany({ userId: testUser._id });
    console.log('🧹 Cleared existing watch history');

    // Get educational videos (the ones we added)
    const eduVideos = await Video.find({
      videoId: { $in: ['edu_001', 'edu_002', 'edu_003'] }
    });
    
    // Get Hostinger videos (educational)
    const hostingerVideos = await Video.find({ channelTitle: 'Hostinger' });
    
    // Get some entertainment videos
    const entertainmentVideos = await Video.find({ channelTitle: 'ARY Digital' }).limit(5);
    
    // Get some music videos
    const musicVideos = await Video.find({ 
      $or: [
        { title: { $regex: 'Music', $options: 'i' } },
        { title: { $regex: 'Song', $options: 'i' } }
      ]
    }).limit(3);

    console.log(`📹 Found ${eduVideos.length} educational videos`);
    console.log(`📹 Found ${hostingerVideos.length} Hostinger videos`);
    console.log(`📹 Found ${entertainmentVideos.length} entertainment videos`);
    console.log(`📹 Found ${musicVideos.length} music videos`);

    // Create realistic watch history with proper distribution
    const watchHistoryEntries = [];
    
    // Add educational videos (60% of watch history)
    const allEducationalVideos = [...eduVideos, ...hostingerVideos];
    for (let i = 0; i < 15; i++) {
      const video = allEducationalVideos[i % allEducationalVideos.length];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor(i / 3));
      watchDate.setHours(14 + (i % 8), Math.floor(Math.random() * 60), 0, 0);
      
      const videoDurationSeconds = video.durationSeconds || 300;
      const watchDuration = Math.floor(videoDurationSeconds * (0.8 + Math.random() * 0.15));
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: videoDurationSeconds,
        source: 'web_app'
      });
    }

    // Add entertainment videos (25% of watch history)
    for (let i = 0; i < 6; i++) {
      const video = entertainmentVideos[i % entertainmentVideos.length];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor((i + 15) / 3));
      watchDate.setHours(20 + (i % 4), Math.floor(Math.random() * 60), 0, 0);
      
      const videoDurationSeconds = video.durationSeconds || 2700; // 45 minutes for dramas
      const watchDuration = Math.floor(videoDurationSeconds * (0.7 + Math.random() * 0.2));
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: videoDurationSeconds,
        source: 'web_app'
      });
    }

    // Add music videos (15% of watch history)
    for (let i = 0; i < 4; i++) {
      const video = musicVideos[i % musicVideos.length];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor((i + 21) / 3));
      watchDate.setHours(12 + (i % 6), Math.floor(Math.random() * 60), 0, 0);
      
      const videoDurationSeconds = video.durationSeconds || 240; // 4 minutes for songs
      const watchDuration = Math.floor(videoDurationSeconds * (0.85 + Math.random() * 0.1));
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: videoDurationSeconds,
        source: 'web_app'
      });
    }
    
    await WatchHistory.insertMany(watchHistoryEntries);
    console.log(`✅ Created ${watchHistoryEntries.length} watch history entries`);

    // Calculate and display final statistics
    const finalWatchHistory = await WatchHistory.find({ userId: testUser._id }).populate('videoId');
    
    const categoryStats = {};
    let totalWatchTime = 0;
    let educationalVideos = 0;
    
    finalWatchHistory.forEach(entry => {
      if (entry.videoId?.classification?.category) {
        const category = entry.videoId.classification.category;
        const watchMinutes = entry.watchDuration / 60;
        
        categoryStats[category] = (categoryStats[category] || 0) + watchMinutes;
        totalWatchTime += watchMinutes;
        
        if (category === 'Educational') {
          educationalVideos++;
        }
      }
    });
    
    const productivityScore = Math.round((educationalVideos / finalWatchHistory.length) * 100);
    
    console.log('\n📊 Dashboard Statistics:');
    console.log(`   Total Videos Watched: ${finalWatchHistory.length}`);
    console.log(`   Educational Videos: ${educationalVideos}`);
    console.log(`   Productivity Score: ${productivityScore}%`);
    console.log(`   Total Watch Time: ${Math.round(totalWatchTime)} minutes`);
    
    console.log('\n📈 Category Distribution:');
    Object.entries(categoryStats).forEach(([category, minutes]) => {
      const percentage = Math.round((minutes / totalWatchTime) * 100);
      console.log(`   ${category}: ${Math.round(minutes)} minutes (${percentage}%)`);
    });

    // Calculate weekly data
    const weeklyData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayHistory = finalWatchHistory.filter(entry => 
        entry.watchedAt >= dayStart && entry.watchedAt <= dayEnd
      );
      
      const dayStats = { day: days[6-i] };
      dayHistory.forEach(entry => {
        if (entry.videoId?.classification?.category) {
          const category = entry.videoId.classification.category;
          const minutes = entry.watchDuration / 60;
          dayStats[category.toLowerCase()] = (dayStats[category.toLowerCase()] || 0) + Math.round(minutes);
        }
      });
      
      weeklyData.push(dayStats);
    }
    
    console.log('\n📅 Weekly Data:');
    weeklyData.forEach(day => {
      console.log(`   ${day.day}: ${JSON.stringify(day)}`);
    });

    console.log('\n✅ Accurate dashboard data created successfully!');

  } catch (error) {
    console.error('❌ Error creating dashboard data:', error);
  } finally {
    mongoose.disconnect();
  }
}

createAccurateDashboardData();
