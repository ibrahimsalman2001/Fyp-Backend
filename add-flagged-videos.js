const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Video = require('./src/models/Video');
const User = require('./src/models/User');

// Connect to MongoDB using the same connection string
async function connectToMongoDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function addFlaggedVideos() {
  try {
    console.log('🎯 Adding flagged videos and enhancing data...');
    
    // Get test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    // Get some videos to flag
    const videos = await Video.find({}).limit(10);
    console.log(`📺 Found ${videos.length} videos to potentially flag`);
    
    let flaggedCount = 0;
    
    // Flag some videos based on content analysis
    for (const video of videos) {
      const title = video.title.toLowerCase();
      const description = (video.description || '').toLowerCase();
      
      let shouldFlag = false;
      let reason = '';
      let severity = 'medium';
      
      // Check for potentially inappropriate content
      if (title.includes('animal') || title.includes('violence') || title.includes('fight')) {
        shouldFlag = true;
        reason = 'Contains violence and mature themes not suitable for younger audiences';
        severity = 'high';
      } else if (title.includes('adult') || title.includes('explicit') || title.includes('mature')) {
        shouldFlag = true;
        reason = 'Contains adult content and explicit material';
        severity = 'high';
      } else if (title.includes('horror') || title.includes('scary') || title.includes('disturbing')) {
        shouldFlag = true;
        reason = 'Contains horror content and disturbing imagery';
        severity = 'medium';
      } else if (title.includes('crime') || title.includes('murder') || title.includes('violence')) {
        shouldFlag = true;
        reason = 'Contains crime-related content and violent themes';
        severity = 'medium';
      }
      
      if (shouldFlag) {
        // Update video classification with flag
        video.classification.flags = [...(video.classification.flags || []), 'inappropriate'];
        
        // Add flag information
        if (!video.classification.flagged) {
          video.classification.flagged = [];
        }
        
        video.classification.flagged.push({
          userId: user._id,
          reason,
          severity,
          flaggedAt: new Date(),
          status: 'active'
        });
        
        // Update age rating if needed
        if (severity === 'high') {
          video.classification.ageRating = '18+';
        } else if (severity === 'medium' && video.classification.ageRating === 'All Ages') {
          video.classification.ageRating = '13+';
        }
        
        await video.save();
        flaggedCount++;
        console.log(`🚩 Flagged: ${video.title.substring(0, 50)}... (${severity})`);
      }
    }
    
    console.log(`\n✅ Flagged ${flaggedCount} videos`);
    
    // Add some additional watch history entries for better analytics
    console.log('📊 Adding additional watch history for better analytics...');
    
    const WatchHistory = require('./src/models/WatchHistory');
    const additionalEntries = [];
    
    for (let i = 0; i < 20; i++) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      const watchDuration = Math.floor(Math.random() * randomVideo.durationSeconds);
      const completionPercentage = Math.min(Math.round((watchDuration / randomVideo.durationSeconds) * 100), 100);
      
      // Random date in the last 30 days
      const watchedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const watchEntry = new WatchHistory({
        userId: user._id,
        videoId: randomVideo._id,
        youtubeVideoId: randomVideo.videoId,
        watchDuration: watchDuration,
        videoDuration: randomVideo.durationSeconds,
        completionPercentage: completionPercentage,
        watchedAt: watchedAt,
        source: 'web_app'
      });
      
      additionalEntries.push(watchEntry);
    }
    
    await WatchHistory.insertMany(additionalEntries);
    console.log(`✅ Added ${additionalEntries.length} additional watch history entries`);
    
    // Update some videos with better classification
    console.log('🎨 Enhancing video classifications...');
    
    for (const video of videos) {
      const title = video.title.toLowerCase();
      
      // Improve category classification
      if (title.includes('react') || title.includes('tutorial') || title.includes('course') || title.includes('programming')) {
        video.classification.category = 'Educational';
        video.classification.confidence = 0.9;
      } else if (title.includes('music') || title.includes('song') || title.includes('album')) {
        video.classification.category = 'Music';
        video.classification.confidence = 0.8;
      } else if (title.includes('cricket') || title.includes('sports') || title.includes('match')) {
        video.classification.category = 'Entertainment';
        video.classification.confidence = 0.85;
      } else if (title.includes('news') || title.includes('interview') || title.includes('report')) {
        video.classification.category = 'News';
        video.classification.confidence = 0.8;
      } else if (title.includes('vlog') || title.includes('family') || title.includes('daily')) {
        video.classification.category = 'Vlogs';
        video.classification.confidence = 0.75;
      }
      
      await video.save();
    }
    
    console.log('✅ Enhanced video classifications');
    
    // Show final statistics
    const totalVideos = await Video.countDocuments();
    const flaggedVideos = await Video.countDocuments({ 'classification.flagged': { $exists: true, $ne: [] } });
    const totalWatchHistory = await WatchHistory.countDocuments();
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   📺 Total Videos: ${totalVideos}`);
    console.log(`   🚩 Flagged Videos: ${flaggedVideos}`);
    console.log(`   ⏱️  Total Watch History Entries: ${totalWatchHistory}`);
    
    // Show flagged videos summary
    const flaggedVideosList = await Video.find({ 'classification.flagged': { $exists: true, $ne: [] } });
    console.log(`\n🚩 Flagged Videos:`);
    flaggedVideosList.forEach((video, index) => {
      const latestFlag = video.classification.flagged[video.classification.flagged.length - 1];
      console.log(`   ${index + 1}. ${video.title.substring(0, 60)}...`);
      console.log(`      Severity: ${latestFlag.severity}, Reason: ${latestFlag.reason.substring(0, 50)}...`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error adding flagged videos:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting flagged videos enhancement...');
  
  const connected = await connectToMongoDB();
  if (!connected) {
    console.log('❌ Could not connect to database');
    process.exit(1);
  }
  
  const success = await addFlaggedVideos();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Enhanced database with flagged videos and better analytics data.');
    console.log('💡 Your dashboard will now show real flagged content and improved analytics.');
  } else {
    console.log('\n❌ Enhancement failed. Check the errors above.');
  }
  
  await mongoose.connection.close();
  console.log('📴 Database connection closed');
}

// Run the script
main().catch(console.error);
