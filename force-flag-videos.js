const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Video = require('./src/models/Video');
const User = require('./src/models/User');

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

async function forceFlagVideos() {
  try {
    console.log('🎯 Force flagging videos for demo purposes...');
    
    // Get test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    // Get some videos to flag
    const videos = await Video.find({}).limit(15);
    console.log(`📺 Found ${videos.length} videos to flag`);
    
    let flaggedCount = 0;
    
    // Flag videos based on various criteria
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      
      let reason = '';
      let severity = 'medium';
      
      // Flag every 3rd video with different severity levels
      if (i % 3 === 0) {
        reason = 'Contains explicit violence, strong language, and mature themes not suitable for younger audiences';
        severity = 'high';
        video.classification.ageRating = '18+';
      } else if (i % 3 === 1) {
        reason = 'Contains sexual references, adult humor, and content inappropriate for minors';
        severity = 'medium';
        if (video.classification.ageRating === 'All Ages') {
          video.classification.ageRating = '13+';
        }
      } else {
        reason = 'Contains disturbing imagery and psychological themes that may not be suitable for all audiences';
        severity = 'medium';
        if (video.classification.ageRating === 'All Ages') {
          video.classification.ageRating = '13+';
        }
      }
      
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
        flaggedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last week
        status: 'active'
      });
      
      await video.save();
      flaggedCount++;
      console.log(`🚩 Flagged: ${video.title.substring(0, 50)}... (${severity})`);
    }
    
    console.log(`\n✅ Flagged ${flaggedCount} videos`);
    
    // Show final statistics
    const totalVideos = await Video.countDocuments();
    const flaggedVideos = await Video.countDocuments({ 'classification.flagged': { $exists: true, $ne: [] } });
    const highSeverity = await Video.countDocuments({ 'classification.flagged.severity': 'high' });
    const mediumSeverity = await Video.countDocuments({ 'classification.flagged.severity': 'medium' });
    
    console.log(`\n📊 Flagged Videos Statistics:`);
    console.log(`   📺 Total Videos: ${totalVideos}`);
    console.log(`   🚩 Flagged Videos: ${flaggedVideos}`);
    console.log(`   🔴 High Severity: ${highSeverity}`);
    console.log(`   🟡 Medium Severity: ${mediumSeverity}`);
    
    // Show flagged videos summary
    const flaggedVideosList = await Video.find({ 'classification.flagged': { $exists: true, $ne: [] } });
    console.log(`\n🚩 Flagged Videos Summary:`);
    flaggedVideosList.forEach((video, index) => {
      const latestFlag = video.classification.flagged[video.classification.flagged.length - 1];
      const severityIcon = latestFlag.severity === 'high' ? '🔴' : '🟡';
      console.log(`   ${index + 1}. ${severityIcon} ${video.title.substring(0, 60)}...`);
      console.log(`      Age Rating: ${video.classification.ageRating}, Severity: ${latestFlag.severity}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error force flagging videos:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting force flagging process...');
  
  const connected = await connectToMongoDB();
  if (!connected) {
    console.log('❌ Could not connect to database');
    process.exit(1);
  }
  
  const success = await forceFlagVideos();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Videos have been flagged for demo purposes.');
    console.log('💡 Your dashboard will now show flagged content with different severity levels.');
  } else {
    console.log('\n❌ Flagging failed. Check the errors above.');
  }
  
  await mongoose.connection.close();
  console.log('📴 Database connection closed');
}

// Run the script
main().catch(console.error);
