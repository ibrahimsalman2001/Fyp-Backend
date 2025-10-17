const fs = require('fs');
const path = require('path');

// Function to parse YouTube video data from HTML
function parseWatchHistory(htmlContent, limit = 50) {
  const videos = [];
  
  // Regular expressions to extract video information
  const videoRegex = /href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">([^<]+)<\/a>/g;
  const channelRegex = /href="https:\/\/www\.youtube\.com\/channel\/([^"]+)">([^<]+)<\/a>/g;
  const dateRegex = /(\w{3}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+\w{2}\s+\w{3})/g;
  
  let match;
  let videoIndex = 0;
  
  // Extract video URLs and titles
  while ((match = videoRegex.exec(htmlContent)) !== null && videoIndex < limit) {
    const videoId = match[1];
    const title = match[2];
    
    // Find the corresponding channel and date information
    // Look for channel info after this video entry
    const afterVideoMatch = htmlContent.substring(match.index);
    const channelMatch = channelRegex.exec(afterVideoMatch);
    const dateMatch = dateRegex.exec(afterVideoMatch);
    
    // Reset regex lastIndex for next iteration
    channelRegex.lastIndex = 0;
    dateRegex.lastIndex = 0;
    
    const videoData = {
      videoId: videoId,
      title: title,
      channelTitle: channelMatch ? channelMatch[2] : 'Unknown Channel',
      channelId: channelMatch ? channelMatch[1] : 'UC' + Math.random().toString(36).substr(2, 22),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      watchedAt: dateMatch ? new Date(dateMatch[1]) : new Date()
    };
    
    videos.push(videoData);
    videoIndex++;
  }
  
  return videos;
}

// Function to generate realistic dummy data based on video title and channel
function generateVideoData(videoInfo) {
  const { videoId, title, channelTitle, channelId } = videoInfo;
  
  // Generate realistic duration (1-30 minutes for most videos)
  const durationMinutes = Math.floor(Math.random() * 29) + 1;
  const durationSeconds = durationMinutes * 60 + Math.floor(Math.random() * 60);
  const duration = `PT${Math.floor(durationMinutes)}M${durationSeconds % 60}S`;
  
  // Generate realistic view count based on channel type
  let viewCount;
  if (channelTitle.includes('T-Series') || channelTitle.includes('Coke Studio')) {
    viewCount = Math.floor(Math.random() * 50000000) + 1000000; // 1M-50M
  } else if (channelTitle.includes('freeCodeCamp')) {
    viewCount = Math.floor(Math.random() * 2000000) + 100000; // 100K-2M
  } else {
    viewCount = Math.floor(Math.random() * 1000000) + 1000; // 1K-1M
  }
  
  // Generate published date (random date in last 2 years)
  const publishedAt = new Date();
  publishedAt.setDate(publishedAt.getDate() - Math.floor(Math.random() * 730));
  
  // Generate category based on title and channel
  let category = 'Entertainment';
  let ageRating = 'All Ages';
  let flags = [];
  
  if (title.toLowerCase().includes('course') || title.toLowerCase().includes('tutorial') || 
      title.toLowerCase().includes('react') || title.toLowerCase().includes('programming')) {
    category = 'Educational';
  } else if (title.toLowerCase().includes('cricket') || title.toLowerCase().includes('sports') || 
             title.toLowerCase().includes('match')) {
    category = 'Entertainment';
  } else if (title.toLowerCase().includes('music') || title.toLowerCase().includes('song')) {
    category = 'Music';
  } else if (title.toLowerCase().includes('news') || title.toLowerCase().includes('interview')) {
    category = 'News';
  } else if (title.toLowerCase().includes('vlog') || title.toLowerCase().includes('family')) {
    category = 'Vlogs';
  }
  
  // Set age rating and flags based on content
  if (title.toLowerCase().includes('animal') || title.toLowerCase().includes('violence')) {
    ageRating = '18+';
    flags.push('violence');
  } else if (title.toLowerCase().includes('adult') || title.toLowerCase().includes('inappropriate')) {
    ageRating = '18+';
    flags.push('adult_content');
  } else if (title.toLowerCase().includes('language') || title.toLowerCase().includes('swear')) {
    ageRating = '13+';
    flags.push('language');
  }
  
  // Generate tags based on title
  const tags = [];
  const titleWords = title.toLowerCase().split(' ');
  const commonTags = ['trending', 'viral', 'popular', 'new', 'latest', 'best', 'top'];
  
  titleWords.forEach(word => {
    if (word.length > 3 && Math.random() > 0.7) {
      tags.push(word);
    }
  });
  
  // Add some random common tags
  if (Math.random() > 0.5) {
    tags.push(commonTags[Math.floor(Math.random() * commonTags.length)]);
  }
  
  // Generate thumbnail URLs (using YouTube's thumbnail API format)
  const thumbnails = {
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  };
  
  // Generate description
  const description = `${title} - Watch this amazing video from ${channelTitle}. Don't forget to like, share and subscribe for more content!`;
  
  return {
    videoId: videoId,
    title: title,
    description: description,
    channelTitle: channelTitle,
    channelId: channelId,
    duration: duration,
    durationSeconds: durationSeconds,
    thumbnails: thumbnails,
    publishedAt: publishedAt,
    tags: tags.slice(0, 5), // Limit to 5 tags
    categoryId: Math.floor(Math.random() * 20) + 1, // Random category ID 1-20
    viewCount: viewCount,
    classification: {
      category: category,
      ageRating: ageRating,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
      flags: flags,
      processedAt: new Date()
    }
  };
}

// Main execution
try {
  console.log('Reading watch-history.html file...');
  const htmlContent = fs.readFileSync('watch-history.html', 'utf8');
  
  console.log('Parsing video data...');
  const rawVideos = parseWatchHistory(htmlContent, 50);
  
  console.log(`Found ${rawVideos.length} videos. Generating detailed data...`);
  
  const videosWithData = rawVideos.map(video => generateVideoData(video));
  
  // Save to JSON file
  const outputFile = 'extracted-videos.json';
  fs.writeFileSync(outputFile, JSON.stringify(videosWithData, null, 2));
  
  console.log(`✅ Successfully extracted ${videosWithData.length} videos to ${outputFile}`);
  console.log('\nFirst 5 videos:');
  videosWithData.slice(0, 5).forEach((video, index) => {
    console.log(`${index + 1}. ${video.title} - ${video.channelTitle}`);
    console.log(`   Duration: ${video.duration}, Views: ${video.viewCount.toLocaleString()}`);
    console.log(`   Category: ${video.classification.category}, Age Rating: ${video.classification.ageRating}`);
    console.log('');
  });
  
} catch (error) {
  console.error('Error:', error.message);
}
