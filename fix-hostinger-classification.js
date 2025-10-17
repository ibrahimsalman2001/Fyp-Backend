const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Video = require('./src/models/Video');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixHostingerClassification() {
  try {
    console.log('🔄 Fixing Hostinger videos classification to Educational...\n');

    // Find all Hostinger videos
    const hostingerVideos = await Video.find({ 
      $or: [
        { channelTitle: 'Hostinger' },
        { title: { $regex: 'Hostinger', $options: 'i' } },
        { title: { $regex: 'VPS Hosting', $options: 'i' } },
        { title: { $regex: 'Client Testimonial', $options: 'i' } }
      ]
    });

    console.log(`📹 Found ${hostingerVideos.length} Hostinger-related videos`);

    // Update them to Educational category
    for (const video of hostingerVideos) {
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            classification: {
              category: 'Educational',
              ageRating: 'All Ages',
              confidence: 0.95,
              flags: [],
              flagged: [],
              processedAt: new Date()
            }
          }
        }
      );
      console.log(`✅ Updated: ${video.title} → Educational`);
    }

    // Also update any programming/tutorial videos
    const programmingVideos = await Video.find({
      $or: [
        { title: { $regex: 'How to', $options: 'i' } },
        { title: { $regex: 'tutorial', $options: 'i' } },
        { title: { $regex: 'guide', $options: 'i' } },
        { title: { $regex: 'create', $options: 'i' } },
        { title: { $regex: 'get', $options: 'i' } }
      ]
    });

    console.log(`\n📹 Found ${programmingVideos.length} programming/tutorial videos`);

    for (const video of programmingVideos) {
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            classification: {
              category: 'Educational',
              ageRating: 'All Ages',
              confidence: 0.90,
              flags: [],
              flagged: [],
              processedAt: new Date()
            }
          }
        }
      );
      console.log(`✅ Updated: ${video.title} → Educational`);
    }

    // Update Parizaad videos to Entertainment
    const parizaadVideos = await Video.find({
      title: { $regex: 'Parizaad', $options: 'i' }
    });

    console.log(`\n📹 Found ${parizaadVideos.length} Parizaad videos`);

    for (const video of parizaadVideos) {
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            classification: {
              category: 'Entertainment',
              ageRating: 'All Ages',
              confidence: 0.95,
              flags: [],
              flagged: [],
              processedAt: new Date()
            }
          }
        }
      );
      console.log(`✅ Updated: ${video.title} → Entertainment`);
    }

    // Update music videos
    const musicVideos = await Video.find({
      $or: [
        { channelTitle: 'Coke Studio Pakistan' },
        { title: { $regex: 'Music Video', $options: 'i' } },
        { title: { $regex: 'Official Video', $options: 'i' } },
        { title: { $regex: 'Song', $options: 'i' } }
      ]
    });

    console.log(`\n📹 Found ${musicVideos.length} music videos`);

    for (const video of musicVideos) {
      await Video.updateOne(
        { _id: video._id },
        { 
          $set: { 
            classification: {
              category: 'Music',
              ageRating: 'All Ages',
              confidence: 0.90,
              flags: [],
              flagged: [],
              processedAt: new Date()
            }
          }
        }
      );
      console.log(`✅ Updated: ${video.title} → Music`);
    }

    // Calculate final statistics
    const allVideos = await Video.find();
    const categoryStats = {};
    
    allVideos.forEach(video => {
      const category = video.classification?.category || 'Unknown';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    console.log('\n📊 Final Category Distribution:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} videos`);
    });

    console.log('\n✅ Video classifications updated successfully!');

  } catch (error) {
    console.error('❌ Error fixing classifications:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixHostingerClassification();
