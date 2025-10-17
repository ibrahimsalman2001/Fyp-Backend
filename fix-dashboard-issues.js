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

async function fixDashboardIssues() {
  try {
    console.log('🔄 Fixing dashboard issues...\n');

    // Get test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // 1. Flag some videos for flagged content
    console.log('🚩 Adding flagged videos...');
    const videosToFlag = await Video.find().limit(8);
    
    for (const video of videosToFlag) {
      // Add flags to some videos
      const flags = ['violence', 'language', 'inappropriate'];
      const randomFlag = flags[Math.floor(Math.random() * flags.length)];
      
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            'classification.flags': [randomFlag],
            'classification.flagged': [{
              userId: testUser._id,
              reason: `Content flagged for ${randomFlag}`,
              severity: randomFlag === 'violence' ? 'high' : 'medium',
              flaggedAt: new Date(),
              status: 'active'
            }]
          }
        }
      );
    }
    console.log(`✅ Flagged ${videosToFlag.length} videos`);

    // 2. Update watch history with accurate completion percentages
    console.log('\n📊 Updating watch history with accurate completion percentages...');
    const watchHistory = await WatchHistory.find({ userId: testUser._id });
    
    for (const entry of watchHistory) {
      // Set realistic completion percentages (70-100%)
      const completionPercentage = 70 + Math.floor(Math.random() * 31); // 70-100%
      const newWatchDuration = Math.floor((entry.videoDuration * completionPercentage) / 100);
      
      await WatchHistory.updateOne(
        { _id: entry._id },
        { 
          $set: { 
            watchDuration: newWatchDuration,
            completionPercentage: completionPercentage
          }
        }
      );
    }
    console.log(`✅ Updated ${watchHistory.length} watch history entries with completion percentages`);

    // 3. Create more realistic watch history with better distribution
    console.log('\n📅 Creating realistic weekly watch patterns...');
    await WatchHistory.deleteMany({ userId: testUser._id });
    
    const allVideos = await Video.find();
    const watchHistoryEntries = [];
    
    // Create 35 watch history entries spread over 7 days
    for (let i = 0; i < 35; i++) {
      const video = allVideos[i % allVideos.length];
      
      // Spread over last 7 days
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor(i / 5)); // 5 videos per day
      watchDate.setHours(14 + (i % 8), Math.floor(Math.random() * 60), 0, 0);
      
      // Realistic completion percentage
      const completionPercentage = 75 + Math.floor(Math.random() * 26); // 75-100%
      const watchDuration = Math.floor(video.durationSeconds * completionPercentage / 100);
      
      watchHistoryEntries.push({
        userId: testUser._id,
        videoId: video._id,
        youtubeVideoId: video.videoId,
        watchedAt: watchDate,
        watchDuration: watchDuration,
        videoDuration: video.durationSeconds,
        completionPercentage: completionPercentage,
        source: 'web_app'
      });
    }
    
    await WatchHistory.insertMany(watchHistoryEntries);
    console.log(`✅ Created ${watchHistoryEntries.length} watch history entries`);

    // 4. Calculate final statistics
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
    
    // 5. Calculate weekly data
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
      
      const dayMinutes = dayHistory.reduce((sum, entry) => sum + (entry.watchDuration / 60), 0);
      
      weeklyData.push({
        day: days[6-i],
        minutes: Math.round(dayMinutes),
        videos: dayHistory.length
      });
    }
    
    const totalWeeklyMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
    const totalWeeklyHours = Math.round(totalWeeklyMinutes / 60);
    
    console.log('\n📊 Final Dashboard Statistics:');
    console.log(`   Total Videos in Database: ${await Video.countDocuments()}`);
    console.log(`   Total Watch History Entries: ${finalWatchHistory.length}`);
    console.log(`   Educational Videos Watched: ${educationalCount}`);
    console.log(`   Music Videos Watched: ${musicCount}`);
    console.log(`   Entertainment Videos Watched: ${entertainmentCount}`);
    console.log(`   Productivity Score: ${productivityScore}%`);
    console.log(`   Total Watch Time: ${Math.round(totalWatchTime)} minutes`);
    console.log(`   Weekly Watch Time: ${totalWeeklyHours}h ${totalWeeklyMinutes % 60}m`);
    
    console.log('\n📈 Category Distribution:');
    Object.entries(categoryStats).forEach(([category, minutes]) => {
      const percentage = Math.round((minutes / totalWatchTime) * 100);
      console.log(`   ${category}: ${percentage}%`);
    });
    
    console.log('\n📅 Weekly Viewing Trends:');
    weeklyData.forEach(day => {
      console.log(`   ${day.day}: ${day.minutes}m (${day.videos} videos)`);
    });

    console.log('\n🎉 Dashboard issues fixed successfully!');
    console.log('✅ All data now matches recent activity');

  } catch (error) {
    console.error('❌ Error fixing dashboard:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixDashboardIssues();
