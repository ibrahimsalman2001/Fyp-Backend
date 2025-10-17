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

async function fixVideoClassifications() {
  try {
    console.log('🔄 Fixing video classifications and ensuring accurate data...\n');

    // Update specific videos with correct classifications
    const videoUpdates = [
      // Hostinger videos - Educational
      {
        title: { $regex: 'Hostinger', $options: 'i' },
        update: {
          classification: {
            category: 'Educational',
            ageRating: 'All Ages',
            confidence: 0.95,
            flags: [],
            flagged: [],
            processedAt: new Date()
          }
        }
      },
      // Programming/Tutorial videos - Educational
      {
        title: { $regex: 'JavaScript|Python|Programming|Tutorial|Course|Web Development', $options: 'i' },
        update: {
          classification: {
            category: 'Educational',
            ageRating: 'All Ages',
            confidence: 0.95,
            flags: [],
            flagged: [],
            processedAt: new Date()
          }
        }
      },
      // Drama/Entertainment videos
      {
        title: { $regex: 'Parizaad|Drama|Entertainment', $options: 'i' },
        update: {
          classification: {
            category: 'Entertainment',
            ageRating: 'All Ages',
            confidence: 0.90,
            flags: [],
            flagged: [],
            processedAt: new Date()
          }
        }
      },
      // Music videos
      {
        title: { $regex: 'Music|Song|Album|Singer', $options: 'i' },
        update: {
          classification: {
            category: 'Music',
            ageRating: 'All Ages',
            confidence: 0.85,
            flags: [],
            flagged: [],
            processedAt: new Date()
          }
        }
      },
      // Gaming videos
      {
        title: { $regex: 'Game|Gaming|Play|Walkthrough', $options: 'i' },
        update: {
          classification: {
            category: 'Gaming',
            ageRating: 'All Ages',
            confidence: 0.88,
            flags: [],
            flagged: [],
            processedAt: new Date()
          }
        }
      }
    ];

    for (const { title, update } of videoUpdates) {
      // Find videos first, then update individually
      const videosToUpdate = await Video.find(title);
      for (const video of videosToUpdate) {
        await Video.updateOne({ _id: video._id }, { $set: update });
      }
      console.log(`✅ Updated ${videosToUpdate.length} videos with classification`);
    }

    // Ensure we have some educational videos in watch history
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      // Get all videos
      const allVideos = await Video.find();
      
      // Clear and recreate watch history with better distribution
      await WatchHistory.deleteMany({ userId: testUser._id });
      
      const watchHistoryEntries = [];
      
      // Create 30 watch history entries with good educational mix
      for (let i = 0; i < 30; i++) {
        const video = allVideos[i % allVideos.length];
        
        // Skip if video doesn't have proper classification
        if (!video.classification || !video.classification.category) {
          continue;
        }
        
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
    }

    // Calculate and display final statistics
    const finalVideos = await Video.find();
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
    console.log(`   Total Videos: ${finalVideos.length}`);
    console.log(`   Total Watch History Entries: ${finalWatchHistory.length}`);
    console.log(`   Educational Videos Watched: ${educationalVideos}`);
    console.log(`   Productivity Score: ${productivityScore}%`);
    console.log(`   Total Watch Time: ${Math.round(totalWatchTime)} minutes`);
    
    console.log('\n📈 Category Distribution:');
    Object.entries(categoryStats).forEach(([category, minutes]) => {
      console.log(`   ${category}: ${Math.round(minutes)} minutes`);
    });

    console.log('\n✅ Video classifications fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing video classifications:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixVideoClassifications();
