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

async function createProperWatchHistory() {
  try {
    console.log('🔄 Creating proper watch history with educational content...\n');

    // Get test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Get videos by category
    const eduVideos = await Video.find({ 'classification.category': 'Educational' });
    const musicVideos = await Video.find({ 'classification.category': 'Music' });
    const entertainmentVideos = await Video.find({ 'classification.category': 'Entertainment' });

    console.log(`📚 Educational videos: ${eduVideos.length}`);
    console.log(`🎵 Music videos: ${musicVideos.length}`);
    console.log(`🎬 Entertainment videos: ${entertainmentVideos.length}`);

    // Clear existing watch history
    await WatchHistory.deleteMany({ userId: testUser._id });
    console.log('🧹 Cleared existing watch history');

    const watchHistoryEntries = [];

    // Add educational videos (40% of watch history - 12 videos)
    for (let i = 0; i < 12; i++) {
      const video = eduVideos[i % eduVideos.length];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor(i / 2)); // 2 educational videos per day
      watchDate.setHours(10 + (i % 4), Math.floor(Math.random() * 60), 0, 0); // Morning hours
      
      const watchDuration = Math.floor(video.durationSeconds * (0.8 + Math.random() * 0.15)); // 80-95% completion
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: video.durationSeconds,
        source: 'web_app'
      });
    }

    // Add music videos (35% of watch history - 10 videos)
    for (let i = 0; i < 10; i++) {
      const video = musicVideos[i % musicVideos.length];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor((i + 12) / 3)); // 3 videos per day
      watchDate.setHours(12 + (i % 6), Math.floor(Math.random() * 60), 0, 0); // Afternoon hours
      
      const watchDuration = Math.floor(video.durationSeconds * (0.85 + Math.random() * 0.1)); // 85-95% completion
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: video.durationSeconds,
        source: 'web_app'
      });
    }

    // Add entertainment videos (25% of watch history - 8 videos)
    for (let i = 0; i < 8; i++) {
      const video = entertainmentVideos[i % entertainmentVideos.length];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor((i + 22) / 3)); // 3 videos per day
      watchDate.setHours(20 + (i % 4), Math.floor(Math.random() * 60), 0, 0); // Evening hours
      
      const watchDuration = Math.floor(video.durationSeconds * (0.7 + Math.random() * 0.2)); // 70-90% completion
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: video.durationSeconds,
        source: 'web_app'
      });
    }

    // Insert watch history
    await WatchHistory.insertMany(watchHistoryEntries);
    console.log(`✅ Created ${watchHistoryEntries.length} watch history entries`);

    // Calculate and display final statistics
    const finalWatchHistory = await WatchHistory.find({ userId: testUser._id }).populate('videoId');
    
    const categoryStats = {};
    let totalWatchTime = 0;
    let educationalCount = 0;
    let musicCount = 0;
    let entertainmentCount = 0;
    
    finalWatchHistory.forEach(entry => {
      if (entry.videoId?.classification?.category) {
        const category = entry.videoId.classification.category;
        const watchMinutes = entry.watchDuration / 60;
        
        categoryStats[category] = (categoryStats[category] || 0) + watchMinutes;
        totalWatchTime += watchMinutes;
        
        if (category === 'Educational') {
          educationalCount++;
        } else if (category === 'Music') {
          musicCount++;
        } else if (category === 'Entertainment') {
          entertainmentCount++;
        }
      }
    });
    
    const productivityScore = Math.round((educationalCount / finalWatchHistory.length) * 100);
    
    console.log('\n📊 Final Dashboard Statistics:');
    console.log(`   Total Videos in Database: ${await Video.countDocuments()}`);
    console.log(`   Total Watch History Entries: ${finalWatchHistory.length}`);
    console.log(`   Educational Videos Watched: ${educationalCount}`);
    console.log(`   Music Videos Watched: ${musicCount}`);
    console.log(`   Entertainment Videos Watched: ${entertainmentCount}`);
    console.log(`   Productivity Score: ${productivityScore}%`);
    console.log(`   Total Watch Time: ${Math.round(totalWatchTime)} minutes`);
    
    console.log('\n📈 Category Distribution:');
    Object.entries(categoryStats).forEach(([category, minutes]) => {
      const percentage = Math.round((minutes / totalWatchTime) * 100);
      console.log(`   ${category}: ${Math.round(minutes)} minutes (${percentage}%)`);
    });

    console.log('\n🎉 Proper watch history created with educational content!');
    console.log('✅ Dashboard will now show realistic productivity scores!');

  } catch (error) {
    console.error('❌ Error creating watch history:', error);
  } finally {
    mongoose.disconnect();
  }
}

createProperWatchHistory();
