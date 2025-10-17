const fs = require('fs');
const path = require('path');

// Function to extract videos from watch-history.html
function extractVideosFromHTML() {
  try {
    console.log('🔄 Extracting real videos from watch-history.html...\n');
    
    const htmlPath = path.join(__dirname, 'watch-history.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Regex to match video URLs and titles
    const videoRegex = /href="(https:\/\/www\.youtube\.com\/watch\?v=([^"]+))"[^>]*>([^<]+)<\/a>/g;
    
    const videos = [];
    let match;
    let count = 0;
    
    while ((match = videoRegex.exec(htmlContent)) !== null && count < 50) {
      const fullUrl = match[1];
      const videoId = match[2];
      const title = match[3].trim();
      
      // Extract channel name from the next line
      const channelMatch = htmlContent.substring(match.index).match(/<a href="https:\/\/www\.youtube\.com\/channel\/[^"]+">([^<]+)<\/a>/);
      const channelName = channelMatch ? channelMatch[1].trim() : 'Unknown Channel';
      
      // Extract timestamp
      const timeMatch = htmlContent.substring(match.index).match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+, \d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM) PKT/);
      const timestamp = timeMatch ? timeMatch[0] : null;
      
      videos.push({
        videoId: videoId,
        title: title,
        channelName: channelName,
        url: fullUrl,
        timestamp: timestamp,
        extracted: true
      });
      
      count++;
    }
    
    console.log(`✅ Extracted ${videos.length} real videos from HTML`);
    
    // Display first 10 videos
    console.log('\n📹 First 10 Real Videos:');
    videos.slice(0, 10).forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Channel: ${video.channelName}`);
      console.log(`   Video ID: ${video.videoId}`);
      console.log(`   Time: ${video.timestamp || 'Unknown'}\n`);
    });
    
    return videos;
    
  } catch (error) {
    console.error('❌ Error extracting videos:', error);
    return [];
  }
}

// Function to generate dummy data for missing fields
function generateDummyDataForVideo(video) {
  // Determine category based on title and channel
  let category = 'Entertainment'; // Default
  let ageRating = 'All Ages';
  let confidence = 0.8;
  
  // Educational content detection
  if (video.title.toLowerCase().includes('tutorial') || 
      video.title.toLowerCase().includes('course') ||
      video.title.toLowerCase().includes('learn') ||
      video.title.toLowerCase().includes('programming') ||
      video.title.toLowerCase().includes('coding') ||
      video.channelName.toLowerCase().includes('tutorial') ||
      video.channelName.toLowerCase().includes('academy') ||
      video.channelName.toLowerCase().includes('education')) {
    category = 'Educational';
    confidence = 0.9;
  }
  
  // Music content detection
  else if (video.title.toLowerCase().includes('song') ||
           video.title.toLowerCase().includes('music') ||
           video.title.toLowerCase().includes('album') ||
           video.channelName.toLowerCase().includes('music') ||
           video.channelName.toLowerCase().includes('records')) {
    category = 'Music';
    confidence = 0.85;
  }
  
  // Gaming content detection
  else if (video.title.toLowerCase().includes('game') ||
           video.title.toLowerCase().includes('gaming') ||
           video.title.toLowerCase().includes('play') ||
           video.title.toLowerCase().includes('walkthrough')) {
    category = 'Gaming';
    confidence = 0.8;
  }
  
  // News content detection
  else if (video.title.toLowerCase().includes('news') ||
           video.title.toLowerCase().includes('breaking') ||
           video.title.toLowerCase().includes('update')) {
    category = 'News';
    confidence = 0.85;
  }
  
  // Generate realistic duration (2-60 minutes)
  const durations = ['PT2M30S', 'PT4M15S', 'PT8M45S', 'PT12M20S', 'PT15M10S', 'PT22M35S', 'PT28M50S', 'PT35M25S', 'PT45M00S', 'PT55M40S'];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  
  // Parse duration to seconds
  const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  let durationSeconds = 0;
  if (durationMatch) {
    const hours = parseInt(durationMatch[1] || '0');
    const minutes = parseInt(durationMatch[2] || '0');
    const seconds = parseInt(durationMatch[3] || '0');
    durationSeconds = hours * 3600 + minutes * 60 + seconds;
  }
  
  // Generate realistic view count
  const viewCounts = [12500, 45000, 89000, 156000, 234000, 567000, 890000, 1200000, 2500000];
  const viewCount = viewCounts[Math.floor(Math.random() * viewCounts.length)];
  
  // Generate channel ID
  const channelId = `UC_${video.channelName.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2, 8)}`;
  
  // Generate tags based on title and category
  const tags = [];
  const titleWords = video.title.toLowerCase().split(' ');
  
  // Add category-specific tags
  if (category === 'Educational') {
    tags.push('tutorial', 'learning', 'education');
  } else if (category === 'Music') {
    tags.push('music', 'song', 'audio');
  } else if (category === 'Gaming') {
    tags.push('gaming', 'gameplay', 'entertainment');
  } else if (category === 'News') {
    tags.push('news', 'current events', 'information');
  } else {
    tags.push('entertainment', 'fun', 'video');
  }
  
  // Add words from title as tags
  titleWords.forEach(word => {
    if (word.length > 3 && !tags.includes(word)) {
      tags.push(word);
    }
  });
  
  // Limit tags to 8
  tags.splice(8);
  
  return {
    videoId: video.videoId,
    title: video.title,
    description: `${video.title} - Watch this amazing video on ${video.channelName}`,
    channelTitle: video.channelName,
    channelId: channelId,
    duration: duration,
    durationSeconds: durationSeconds,
    thumbnails: {
      default: `https://i.ytimg.com/vi/${video.videoId}/default.jpg`,
      medium: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
      high: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
    },
    publishedAt: video.timestamp ? new Date(video.timestamp) : new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    tags: tags,
    categoryId: category === 'Educational' ? '28' : category === 'Music' ? '10' : category === 'Gaming' ? '20' : '23',
    viewCount: viewCount,
    classification: {
      category: category,
      ageRating: ageRating,
      confidence: confidence,
      flags: [],
      flagged: [],
      processedAt: new Date()
    }
  };
}

// Main function
function main() {
  console.log('🎬 Starting Real Video Extraction from watch-history.html\n');
  
  // Extract real videos from HTML
  const realVideos = extractVideosFromHTML();
  
  if (realVideos.length === 0) {
    console.log('❌ No videos found in HTML file');
    return;
  }
  
  // Generate complete video data with dummy fields
  const completeVideos = realVideos.map(video => {
    return generateDummyDataForVideo(video);
  });
  
  // Save to JSON file
  const outputPath = path.join(__dirname, 'real-extracted-videos.json');
  fs.writeFileSync(outputPath, JSON.stringify(completeVideos, null, 2));
  
  console.log(`\n✅ Generated ${completeVideos.length} complete video records`);
  console.log(`📁 Saved to: ${outputPath}`);
  
  // Display statistics
  const categoryStats = {};
  completeVideos.forEach(video => {
    const category = video.classification.category;
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });
  
  console.log('\n📊 Category Distribution:');
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} videos`);
  });
  
  console.log('\n🎉 Real video extraction completed!');
  console.log('📝 Next step: Insert these videos into database');
}

main();
