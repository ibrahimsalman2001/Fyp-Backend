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

async function checkEducationalVideos() {
  try {
    console.log('🔍 Checking educational videos...\n');

    // Get all educational videos
    const educationalVideos = await Video.find({ 'classification.category': 'Educational' });
    console.log(`📚 Found ${educationalVideos.length} educational videos:`);
    
    educationalVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Channel: ${video.channelTitle}`);
      console.log(`   Category: ${video.classification.category}\n`);
    });

    // Get test user and watch history
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      const watchHistory = await WatchHistory.find({ userId: testUser._id }).populate('videoId');
      console.log(`📊 Total watch history entries: ${watchHistory.length}`);
      
      const educationalWatched = watchHistory.filter(entry => 
        entry.videoId?.classification?.category === 'Educational'
      );
      console.log(`📚 Educational videos watched: ${educationalWatched.length}`);
      
      if (educationalWatched.length > 0) {
        console.log('\nEducational videos in watch history:');
        educationalWatched.forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.videoId.title}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkEducationalVideos();
