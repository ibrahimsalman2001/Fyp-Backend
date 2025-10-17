const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Import models exactly like your app does
const Video = require('./src/models/Video');
const WatchHistory = require('./src/models/WatchHistory');
const User = require('./src/models/User');

// Try multiple MongoDB connection strings
const connectionStrings = [
  process.env.MONGODB_URI,
  'mongodb://localhost:27017/fyp-database',
  'mongodb://127.0.0.1:27017/fyp-database',
  'mongodb://localhost:27017/taskmind-database',
  'mongodb://127.0.0.1:27017/taskmind-database'
].filter(Boolean); // Remove undefined values

async function connectToMongoDB() {
  for (const uri of connectionStrings) {
    try {
      console.log(`🔄 Trying to connect to: ${uri}`);
      
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to connect to ${uri}: ${error.message}`);
      continue;
    }
  }
  
  console.log('❌ Could not connect to any MongoDB instance');
  return false;
}

async function insertData() {
  try {
    // Load the data
    console.log('📁 Loading data files...');
    const videoData = JSON.parse(fs.readFileSync('extracted-videos.json', 'utf8'));
    
    // Create or get test user
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
              daily: 480,
              weekly: 3360
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
    
    let insertedVideos = 0;
    let insertedWatchHistory = 0;
    
    console.log(`📹 Processing ${videoData.length} videos...`);
    
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
          watchDuration: Math.floor(Math.random() * videoInfo.durationSeconds),
          videoDuration: videoInfo.durationSeconds,
          watchedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          source: 'web_app'
        });
        
        await watchHistory.save();
        insertedWatchHistory++;
        
      } catch (error) {
        console.error(`❌ Error processing video ${videoInfo.videoId}:`, error.message);
      }
    }
    
    console.log(`\n🎉 SUCCESS! Data inserted:`);
    console.log(`   📺 Videos: ${insertedVideos} new videos`);
    console.log(`   ⏱️  Watch History: ${insertedWatchHistory} entries`);
    console.log(`   👤 User: ${user.name} (${user.email})`);
    
    // Show final counts
    const totalVideos = await Video.countDocuments();
    const totalWatchHistory = await WatchHistory.countDocuments();
    const totalUsers = await User.countDocuments();
    
    console.log(`\n📊 Database totals:`);
    console.log(`   📺 Total Videos: ${totalVideos}`);
    console.log(`   ⏱️  Total Watch History: ${totalWatchHistory}`);
    console.log(`   👤 Total Users: ${totalUsers}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error inserting data:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting data insertion process...');
  
  const connected = await connectToMongoDB();
  if (!connected) {
    console.log('\n💡 SOLUTIONS:');
    console.log('1. Start MongoDB service: mongod');
    console.log('2. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.log('3. Use MongoDB Atlas (cloud) and set MONGODB_URI in .env');
    console.log('4. Use Docker: docker run -d -p 27017:27017 mongo');
    process.exit(1);
  }
  
  const success = await insertData();
  
  if (success) {
    console.log('\n🎉 ALL DONE! Your data is now in the database.');
    console.log('💡 You can now start your server and the data will be available.');
  } else {
    console.log('\n❌ Data insertion failed. Check the errors above.');
  }
  
  await mongoose.connection.close();
  console.log('📴 Database connection closed');
}

// Run the script
main().catch(console.error);
