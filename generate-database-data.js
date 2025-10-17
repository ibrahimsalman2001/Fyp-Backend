const fs = require('fs');

// Function to generate database-ready data
function generateDatabaseData() {
  try {
    // Read the extracted video data
    const videoData = JSON.parse(fs.readFileSync('extracted-videos.json', 'utf8'));
    
    console.log(`📹 Processing ${videoData.length} videos for database insertion...`);
    
    // Generate a test user
    const testUser = {
      _id: new Date().getTime().toString(),
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
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Process videos and generate watch history
    const videos = [];
    const watchHistoryEntries = [];
    
    videoData.forEach((videoInfo, index) => {
      // Add MongoDB _id to video
      const video = {
        ...videoInfo,
        _id: new Date().getTime() + index,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      videos.push(video);
      
      // Generate multiple watch history entries for some videos (realistic scenario)
      const numWatches = Math.floor(Math.random() * 3) + 1; // 1-3 watch sessions
      
      for (let i = 0; i < numWatches; i++) {
        const watchDuration = Math.floor(Math.random() * videoInfo.durationSeconds);
        const completionPercentage = Math.min(Math.round((watchDuration / videoInfo.durationSeconds) * 100), 100);
        
        const watchHistory = {
          _id: new Date().getTime() + index * 100 + i,
          userId: testUser._id,
          videoId: video._id,
          youtubeVideoId: videoInfo.videoId,
          watchDuration: watchDuration,
          videoDuration: videoInfo.durationSeconds,
          completionPercentage: completionPercentage,
          watchedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          sessionId: `session_${Date.now()}_${index}_${i}`,
          source: 'web_app',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        watchHistoryEntries.push(watchHistory);
      }
    });
    
    // Create database data structure
    const databaseData = {
      users: [testUser],
      videos: videos,
      watchHistory: watchHistoryEntries,
      metadata: {
        generatedAt: new Date(),
        totalVideos: videos.length,
        totalWatchHistoryEntries: watchHistoryEntries.length,
        totalUsers: 1,
        description: 'Generated from YouTube watch history HTML file'
      }
    };
    
    // Save to JSON file
    const outputFile = 'database-data.json';
    fs.writeFileSync(outputFile, JSON.stringify(databaseData, null, 2));
    
    // Also create individual files for easier importing
    fs.writeFileSync('users.json', JSON.stringify([testUser], null, 2));
    fs.writeFileSync('videos-db.json', JSON.stringify(videos, null, 2));
    fs.writeFileSync('watch-history-db.json', JSON.stringify(watchHistoryEntries, null, 2));
    
    // Generate MongoDB import scripts
    generateMongoImportScripts(videos, watchHistoryEntries, testUser);
    
    console.log(`✅ Generated database data:`);
    console.log(`   📁 ${outputFile} - Complete database data`);
    console.log(`   👤 users.json - User data`);
    console.log(`   📺 videos-db.json - Video data`);
    console.log(`   ⏱️  watch-history-db.json - Watch history data`);
    console.log(`   📜 mongo-import.sh - MongoDB import script`);
    
    // Display statistics
    displayStatistics(videos, watchHistoryEntries, testUser);
    
  } catch (error) {
    console.error('❌ Error generating database data:', error.message);
  }
}

// Function to generate MongoDB import scripts
function generateMongoImportScripts(videos, watchHistoryEntries, testUser) {
  const importScript = `#!/bin/bash
# MongoDB Import Script
# Run this script to import the generated data into your MongoDB database

echo "🚀 Starting MongoDB import process..."

# Set your database name here
DB_NAME="fyp-database"

# Import users
echo "📥 Importing users..."
mongoimport --db $DB_NAME --collection users --file users.json --jsonArray

# Import videos
echo "📥 Importing videos..."
mongoimport --db $DB_NAME --collection videos --file videos-db.json --jsonArray

# Import watch history
echo "📥 Importing watch history..."
mongoimport --db $DB_NAME --collection watchhistories --file watch-history-db.json --jsonArray

echo "✅ Import completed successfully!"
echo "📊 Summary:"
echo "   Users: 1"
echo "   Videos: ${videos.length}"
echo "   Watch History Entries: ${watchHistoryEntries.length}"
`;

  fs.writeFileSync('mongo-import.sh', importScript);
  
  // Also create a Windows batch file
  const batchScript = `@echo off
REM MongoDB Import Script for Windows
REM Run this script to import the generated data into your MongoDB database

echo 🚀 Starting MongoDB import process...

REM Set your database name here
set DB_NAME=fyp-database

REM Import users
echo 📥 Importing users...
mongoimport --db %DB_NAME% --collection users --file users.json --jsonArray

REM Import videos
echo 📥 Importing videos...
mongoimport --db %DB_NAME% --collection videos --file videos-db.json --jsonArray

REM Import watch history
echo 📥 Importing watch history...
mongoimport --db %DB_NAME% --collection watchhistories --file watch-history-db.json --jsonArray

echo ✅ Import completed successfully!
echo 📊 Summary:
echo    Users: 1
echo    Videos: ${videos.length}
echo    Watch History Entries: ${watchHistoryEntries.length}
pause
`;

  fs.writeFileSync('mongo-import.bat', batchScript);
}

// Function to display statistics
function displayStatistics(videos, watchHistoryEntries, testUser) {
  console.log(`\n📊 Generated Data Statistics:`);
  console.log(`   👤 Users: 1 (${testUser.name})`);
  console.log(`   📺 Videos: ${videos.length}`);
  console.log(`   ⏱️  Watch History Entries: ${watchHistoryEntries.length}`);
  
  // Video statistics by category
  const categoryStats = {};
  const ageRatingStats = {};
  let totalViews = 0;
  let totalWatchTime = 0;
  
  videos.forEach(video => {
    const category = video.classification.category;
    const ageRating = video.classification.ageRating;
    
    categoryStats[category] = (categoryStats[category] || 0) + 1;
    ageRatingStats[ageRating] = (ageRatingStats[ageRating] || 0) + 1;
    totalViews += video.viewCount;
  });
  
  watchHistoryEntries.forEach(entry => {
    totalWatchTime += entry.watchDuration;
  });
  
  console.log(`\n📺 Videos by Category:`);
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} videos`);
  });
  
  console.log(`\n👶 Videos by Age Rating:`);
  Object.entries(ageRatingStats).forEach(([rating, count]) => {
    console.log(`   ${rating}: ${count} videos`);
  });
  
  console.log(`\n📈 Engagement Statistics:`);
  console.log(`   Total Views: ${totalViews.toLocaleString()}`);
  console.log(`   Average Views per Video: ${Math.round(totalViews / videos.length).toLocaleString()}`);
  console.log(`   Total Watch Time: ${Math.round(totalWatchTime / 3600)} hours`);
  console.log(`   Average Watch Session: ${Math.round(totalWatchTime / watchHistoryEntries.length / 60)} minutes`);
  
  console.log(`\n🎯 Sample Videos:`);
  videos.slice(0, 5).forEach((video, index) => {
    console.log(`   ${index + 1}. ${video.title.substring(0, 60)}...`);
    console.log(`      Channel: ${video.channelTitle}`);
    console.log(`      Views: ${video.viewCount.toLocaleString()}, Duration: ${video.duration}`);
    console.log(`      Category: ${video.classification.category}, Age: ${video.classification.ageRating}`);
  });
}

// Run the script
if (require.main === module) {
  generateDatabaseData();
}

module.exports = { generateDatabaseData };
