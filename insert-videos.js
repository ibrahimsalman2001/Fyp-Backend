const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Import models
const Video = require('./src/models/Video');
const WatchHistory = require('./src/models/WatchHistory');
const User = require('./src/models/User');

// Database connection
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fyp-database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Function to create a test user if none exists
async function createTestUser() {
  try {
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      user = new User({
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'test-google-id-123',
        profilePicture: 'https://via.placeholder.com/150',
        preferences: {
          parentalControls: {
            enabled: false,
            ageRating: 'All Ages',
            blockedCategories: [],
            timeLimits: {
              daily: 480, // 8 hours
              weekly: 3360 // 56 hours
            }
          },
          notifications: {
            email: true,
            push: true,
            weekly: true
          }
        }
      });
      
      await user.save();
      console.log('✅ Created test user');
    } else {
      console.log('✅ Test user already exists');
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

// Function to insert videos and create watch history
async function insertVideoData() {
  try {
    // Read the extracted video data
    const videoData = JSON.parse(fs.readFileSync('extracted-videos.json', 'utf8'));
    
    console.log(`📹 Processing ${videoData.length} videos...`);
    
    // Get or create test user
    const user = await createTestUser();
    
    let insertedVideos = 0;
    let insertedWatchHistory = 0;
    
    for (const videoInfo of videoData) {
      try {
        // Check if video already exists
        let video = await Video.findOne({ videoId: videoInfo.videoId });
        
        if (!video) {
          // Create new video
          video = new Video(videoInfo);
          await video.save();
          insertedVideos++;
          console.log(`✅ Inserted video: ${videoInfo.title.substring(0, 50)}...`);
        } else {
          console.log(`⏭️  Video already exists: ${videoInfo.title.substring(0, 50)}...`);
        }
        
        // Create watch history entry
        const watchHistory = new WatchHistory({
          userId: user._id,
          videoId: video._id,
          youtubeVideoId: videoInfo.videoId,
          watchDuration: Math.floor(Math.random() * videoInfo.durationSeconds), // Random watch duration
          videoDuration: videoInfo.durationSeconds,
          watchedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          source: 'web_app'
        });
        
        await watchHistory.save();
        insertedWatchHistory++;
        
      } catch (error) {
        console.error(`❌ Error processing video ${videoInfo.videoId}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Videos inserted: ${insertedVideos}`);
    console.log(`   Watch history entries created: ${insertedWatchHistory}`);
    console.log(`   Total videos in database: ${await Video.countDocuments()}`);
    console.log(`   Total watch history entries: ${await WatchHistory.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error inserting video data:', error.message);
    throw error;
  }
}

// Function to display some statistics
async function displayStats() {
  try {
    console.log('\n📈 Database Statistics:');
    
    const videoStats = await Video.aggregate([
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 },
          avgViews: { $avg: '$viewCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📺 Videos by Category:');
    videoStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} videos (avg ${Math.round(stat.avgViews).toLocaleString()} views)`);
    });
    
    const ageRatingStats = await Video.aggregate([
      {
        $group: {
          _id: '$classification.ageRating',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n👶 Videos by Age Rating:');
    ageRatingStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} videos`);
    });
    
    const watchHistoryStats = await WatchHistory.aggregate([
      {
        $group: {
          _id: null,
          totalWatchTime: { $sum: '$watchDuration' },
          avgCompletion: { $avg: '$completionPercentage' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);
    
    if (watchHistoryStats.length > 0) {
      const stats = watchHistoryStats[0];
      console.log('\n⏱️  Watch History Statistics:');
      console.log(`   Total watch time: ${Math.round(stats.totalWatchTime / 3600)} hours`);
      console.log(`   Average completion rate: ${Math.round(stats.avgCompletion)}%`);
      console.log(`   Total watch sessions: ${stats.totalSessions}`);
    }
    
  } catch (error) {
    console.error('❌ Error displaying stats:', error.message);
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await insertVideoData();
    await displayStats();
    
    console.log('\n🎉 Video data insertion completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { insertVideoData, createTestUser, displayStats };
