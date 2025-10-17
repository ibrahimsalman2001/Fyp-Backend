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

async function fixVideoData() {
  try {
    console.log('🔄 Fixing video data with accurate information...\n');

    // Get test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Clear existing watch history
    await WatchHistory.deleteMany({ userId: testUser._id });
    console.log('🧹 Cleared existing watch history');

    // Get all videos
    const allVideos = await Video.find();
    console.log(`📹 Found ${allVideos.length} videos`);

    // Manually update specific videos with correct classifications
    const specificUpdates = [
      {
        videoId: 'edu_001',
        classification: {
          category: 'Educational',
          ageRating: 'All Ages',
          confidence: 0.95,
          flags: [],
          flagged: [],
          processedAt: new Date()
        }
      },
      {
        videoId: 'edu_002',
        classification: {
          category: 'Educational',
          ageRating: 'All Ages',
          confidence: 0.93,
          flags: [],
          flagged: [],
          processedAt: new Date()
        }
      },
      {
        videoId: 'edu_003',
        classification: {
          category: 'Educational',
          ageRating: 'All Ages',
          confidence: 0.94,
          flags: [],
          flagged: [],
          processedAt: new Date()
        }
      }
    ];

    for (const update of specificUpdates) {
      const result = await Video.updateOne(
        { videoId: update.videoId },
        { $set: { classification: update.classification } }
      );
      console.log(`✅ Updated video ${update.videoId}: ${result.modifiedCount} modified`);
    }

    // Update some existing videos to be educational
    const hostingerVideos = await Video.find({ channelTitle: 'Hostinger' });
    for (const video of hostingerVideos) {
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            classification: {
              category: 'Educational',
              ageRating: 'All Ages',
              confidence: 0.95,
              flags: [],
              flagged: [],
              processedAt: new Date()
            }
          }
        }
      );
    }
    console.log(`✅ Updated ${hostingerVideos.length} Hostinger videos as Educational`);

    // Update some Parizaad videos as Entertainment
    const parizaadVideos = await Video.find({ channelTitle: 'ARY Digital' });
    for (const video of parizaadVideos) {
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            classification: {
              category: 'Entertainment',
              ageRating: 'All Ages',
              confidence: 0.90,
              flags: [],
              flagged: [],
              processedAt: new Date()
            }
          }
        }
      );
    }
    console.log(`✅ Updated ${parizaadVideos.length} ARY Digital videos as Entertainment`);

    // Create realistic watch history with good educational mix
    const watchHistoryEntries = [];
    const videos = await Video.find();
    
    // Create 25 watch history entries with good distribution
    for (let i = 0; i < 25; i++) {
      const video = videos[i % videos.length];
      
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor(i / 3)); // 3 videos per day
      watchDate.setHours(14 + (i % 8), Math.floor(Math.random() * 60), 0, 0);
      
      // Calculate realistic watch duration
      const videoDurationSeconds = video.durationSeconds || 300;
      const watchDuration = Math.floor(videoDurationSeconds * (0.75 + Math.random() * 0.2)); // 75-95% completion
      
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
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Total Watch History Entries: ${finalWatchHistory.length}`);
    console.log(`   Educational Videos Watched: ${educationalVideos}`);
    console.log(`   Productivity Score: ${productivityScore}%`);
    console.log(`   Total Watch Time: ${Math.round(totalWatchTime)} minutes`);
    
    console.log('\n📈 Category Distribution:');
    Object.entries(categoryStats).forEach(([category, minutes]) => {
      console.log(`   ${category}: ${Math.round(minutes)} minutes`);
    });

    console.log('\n✅ Video data fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing video data:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixVideoData();
