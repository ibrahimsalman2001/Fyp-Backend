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

async function updateVideoMetadata() {
  try {
    console.log('🔄 Updating video metadata with accurate information...\n');

    // Update specific videos with correct information
    const videoUpdates = [
      {
        title: 'Hostinger.pk | Client Testimonial | Gabrielle Scarlett',
        channelTitle: 'Hostinger',
        channelId: 'UC_hostinger_001',
        description: 'Client testimonial from Gabrielle Scarlett about Hostinger.pk web hosting services',
        duration: 'PT3M45S',
        durationSeconds: 225,
        classification: {
          category: 'Educational',
          ageRating: 'All Ages',
          confidence: 0.95,
          flags: [],
          flagged: [],
          processedAt: new Date()
        },
        tags: ['web hosting', 'testimonial', 'client review', 'hostinger', 'educational']
      },
      {
        title: 'VPS Hosting | Hostinger.pk #shorts',
        channelTitle: 'Hostinger',
        channelId: 'UC_hostinger_002',
        description: 'Quick overview of VPS hosting services provided by Hostinger.pk',
        duration: 'PT1M30S',
        durationSeconds: 90,
        classification: {
          category: 'Educational',
          ageRating: 'All Ages',
          confidence: 0.92,
          flags: [],
          flagged: [],
          processedAt: new Date()
        },
        tags: ['vps hosting', 'web hosting', 'shorts', 'educational', 'hostinger']
      },
      {
        title: 'Parizaad',
        channelTitle: 'ARY Digital',
        channelId: 'UC_ary_digital_001',
        description: 'Parizaad drama episode on ARY Digital',
        duration: 'PT45M00S',
        durationSeconds: 2700,
        classification: {
          category: 'Entertainment',
          ageRating: 'All Ages',
          confidence: 0.88,
          flags: [],
          flagged: [],
          processedAt: new Date()
        },
        tags: ['drama', 'parizaad', 'ary digital', 'entertainment', 'urdu drama']
      }
    ];

    for (const update of videoUpdates) {
      // Find videos by title and update
      const result = await Video.updateMany(
        { title: { $regex: update.title, $options: 'i' } },
        { $set: update }
      );
      console.log(`✅ Updated ${result.modifiedCount} videos for: ${update.title}`);
    }

    // Add more realistic educational videos
    const educationalVideos = [
      {
        videoId: 'edu_001',
        title: 'JavaScript Tutorial for Beginners',
        description: 'Complete JavaScript tutorial for beginners',
        channelTitle: 'Programming Hub',
        channelId: 'UC_programming_hub',
        duration: 'PT15M30S',
        durationSeconds: 930,
        thumbnails: {
          default: 'https://i.ytimg.com/vi/edu_001/default.jpg',
          medium: 'https://i.ytimg.com/vi/edu_001/mqdefault.jpg'
        },
        publishedAt: new Date('2024-01-15'),
        tags: ['javascript', 'programming', 'tutorial', 'educational'],
        categoryId: '28', // Science & Technology
        viewCount: 125000,
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
        title: 'Web Development Complete Course',
        description: 'Full-stack web development course',
        channelTitle: 'Code Academy',
        channelId: 'UC_code_academy',
        duration: 'PT45M15S',
        durationSeconds: 2715,
        thumbnails: {
          default: 'https://i.ytimg.com/vi/edu_002/default.jpg',
          medium: 'https://i.ytimg.com/vi/edu_002/mqdefault.jpg'
        },
        publishedAt: new Date('2024-02-10'),
        tags: ['web development', 'html', 'css', 'javascript', 'educational'],
        categoryId: '28',
        viewCount: 89000,
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
        title: 'Python Programming Basics',
        description: 'Learn Python programming from scratch',
        channelTitle: 'Python Tutorials',
        channelId: 'UC_python_tutorials',
        duration: 'PT25M45S',
        durationSeconds: 1545,
        thumbnails: {
          default: 'https://i.ytimg.com/vi/edu_003/default.jpg',
          medium: 'https://i.ytimg.com/vi/edu_003/mqdefault.jpg'
        },
        publishedAt: new Date('2024-03-05'),
        tags: ['python', 'programming', 'basics', 'educational'],
        categoryId: '28',
        viewCount: 156000,
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

    // Insert educational videos if they don't exist
    for (const video of educationalVideos) {
      const existing = await Video.findOne({ videoId: video.videoId });
      if (!existing) {
        await Video.create(video);
        console.log(`✅ Added educational video: ${video.title}`);
      }
    }

    // Create realistic watch history with proper durations
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Clear existing watch history
    await WatchHistory.deleteMany({ userId: testUser._id });
    console.log('🧹 Cleared existing watch history');

    // Create realistic watch history entries
    const videos = await Video.find().limit(20);
    const watchHistoryEntries = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - i); // Different dates
      watchDate.setHours(14 + (i % 8)); // Different hours (2 PM to 10 PM)
      watchDate.setMinutes(Math.floor(Math.random() * 60));

      // Calculate realistic watch duration (80-95% of video duration)
      const durationMatch = video.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      let videoDurationSeconds = 0;
      if (durationMatch) {
        const hours = parseInt(durationMatch[1] || '0');
        const minutes = parseInt(durationMatch[2] || '0');
        const seconds = parseInt(durationMatch[3] || '0');
        videoDurationSeconds = hours * 3600 + minutes * 60 + seconds;
      } else {
        videoDurationSeconds = 300; // Default 5 minutes
      }

      const watchDuration = Math.floor(videoDurationSeconds * (0.8 + Math.random() * 0.15)); // 80-95% completion

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

    // Insert watch history
    await WatchHistory.insertMany(watchHistoryEntries);
    console.log(`✅ Created ${watchHistoryEntries.length} watch history entries`);

    // Calculate and display statistics
    const totalWatchTime = watchHistoryEntries.reduce((sum, entry) => sum + entry.watchDuration, 0);
    const educationalVideosWatched = watchHistoryEntries.filter(entry => 
      entry.category === 'Educational'
    ).length;
    const productivityScore = Math.round((educationalVideosWatched / watchHistoryEntries.length) * 100);

    console.log('\n📊 Updated Statistics:');
    console.log(`   Total Videos Watched: ${watchHistoryEntries.length}`);
    console.log(`   Educational Videos: ${educationalVideosWatched}`);
    console.log(`   Productivity Score: ${productivityScore}%`);
    console.log(`   Total Watch Time: ${Math.round(totalWatchTime / 60)} minutes`);

    console.log('\n✅ Video metadata update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating video metadata:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateVideoMetadata();
