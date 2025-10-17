const fs = require('fs');

// Load the extracted videos
const videoData = JSON.parse(fs.readFileSync('extracted-videos.json', 'utf8'));

console.log('Creating database data...');

// Create test user
const testUser = {
  _id: new Date().getTime().toString(),
  email: 'test@example.com',
  name: 'Test User',
  googleId: 'test-google-id-123'
};

// Process videos
const videos = [];
const watchHistory = [];

videoData.forEach((videoInfo, index) => {
  // Create video with MongoDB-style _id
  const video = {
    _id: new Date().getTime() + index,
    ...videoInfo
  };
  videos.push(video);
  
  // Create watch history entry
  const watchEntry = {
    _id: new Date().getTime() + index * 100,
    userId: testUser._id,
    videoId: video._id,
    youtubeVideoId: videoInfo.videoId,
    watchDuration: Math.floor(Math.random() * videoInfo.durationSeconds),
    videoDuration: videoInfo.durationSeconds,
    completionPercentage: Math.floor(Math.random() * 100),
    watchedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  };
  watchHistory.push(watchEntry);
});

// Save individual collections
fs.writeFileSync('videos.json', JSON.stringify(videos, null, 2));
fs.writeFileSync('watchhistories.json', JSON.stringify(watchHistory, null, 2));
fs.writeFileSync('users.json', JSON.stringify([testUser], null, 2));

console.log(`✅ Created ${videos.length} videos and ${watchHistory.length} watch history entries`);
console.log('Files created: videos.json, watchhistories.json, users.json');
