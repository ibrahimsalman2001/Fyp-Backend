const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Function to load mock data
function loadMockData() {
  try {
    const dataPath = path.join(__dirname, '../../database-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return data;
  } catch (error) {
    console.error('Error loading mock data:', error.message);
    return null;
  }
}

// GET /api/mock-data - Get all mock data
router.get('/', (req, res) => {
  try {
    const data = loadMockData();
    
    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Mock data not available'
      });
    }
    
    res.json({
      success: true,
      data: {
        users: data.users,
        videos: data.videos,
        watchHistory: data.watchHistory,
        metadata: data.metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error loading mock data',
      error: error.message
    });
  }
});

// GET /api/mock-data/videos - Get all videos
router.get('/videos', (req, res) => {
  try {
    const data = loadMockData();
    
    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Mock data not available'
      });
    }
    
    // Support pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const videos = data.videos.slice(skip, skip + limit);
    const total = data.videos.length;
    
    res.json({
      success: true,
      data: {
        videos: videos,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error loading videos',
      error: error.message
    });
  }
});

// GET /api/mock-data/watch-history - Get watch history
router.get('/watch-history', (req, res) => {
  try {
    const data = loadMockData();
    
    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Mock data not available'
      });
    }
    
    // Support pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const watchHistory = data.watchHistory.slice(skip, skip + limit);
    const total = data.watchHistory.length;
    
    res.json({
      success: true,
      data: {
        watchHistory: watchHistory,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error loading watch history',
      error: error.message
    });
  }
});

// GET /api/mock-data/videos/:videoId - Get specific video
router.get('/videos/:videoId', (req, res) => {
  try {
    const data = loadMockData();
    const videoId = req.params.videoId;
    
    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Mock data not available'
      });
    }
    
    const video = data.videos.find(v => v.videoId === videoId || v._id.toString() === videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.json({
      success: true,
      data: { video: video }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error loading video',
      error: error.message
    });
  }
});

// GET /api/mock-data/analytics - Get analytics data
router.get('/analytics', (req, res) => {
  try {
    const data = loadMockData();
    
    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Mock data not available'
      });
    }
    
    // Calculate analytics
    const analytics = {
      totalVideos: data.videos.length,
      totalWatchTime: data.watchHistory.reduce((sum, entry) => sum + entry.watchDuration, 0),
      totalViews: data.videos.reduce((sum, video) => sum + video.viewCount, 0),
      averageCompletionRate: data.watchHistory.reduce((sum, entry) => sum + entry.completionPercentage, 0) / data.watchHistory.length,
      
      videosByCategory: {},
      videosByAgeRating: {},
      watchTimeByDay: {},
      
      topVideos: data.videos
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10)
        .map(video => ({
          title: video.title,
          channelTitle: video.channelTitle,
          viewCount: video.viewCount,
          duration: video.duration
        }))
    };
    
    // Calculate category and age rating distribution
    data.videos.forEach(video => {
      const category = video.classification.category;
      const ageRating = video.classification.ageRating;
      
      analytics.videosByCategory[category] = (analytics.videosByCategory[category] || 0) + 1;
      analytics.videosByAgeRating[ageRating] = (analytics.videosByAgeRating[ageRating] || 0) + 1;
    });
    
    // Calculate watch time by day (last 30 days)
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      analytics.watchTimeByDay[dateStr] = 0;
    }
    
    data.watchHistory.forEach(entry => {
      const dateStr = new Date(entry.watchedAt).toISOString().split('T')[0];
      if (analytics.watchTimeByDay[dateStr] !== undefined) {
        analytics.watchTimeByDay[dateStr] += entry.watchDuration;
      }
    });
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating analytics',
      error: error.message
    });
  }
});

// GET /api/mock-data/stats - Get basic statistics
router.get('/stats', (req, res) => {
  try {
    const data = loadMockData();
    
    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Mock data not available'
      });
    }
    
    const stats = {
      generatedAt: data.metadata.generatedAt,
      totalVideos: data.metadata.totalVideos,
      totalWatchHistoryEntries: data.metadata.totalWatchHistoryEntries,
      totalUsers: data.metadata.totalUsers,
      
      // Quick stats
      totalViews: data.videos.reduce((sum, video) => sum + video.viewCount, 0),
      totalWatchTime: data.watchHistory.reduce((sum, entry) => sum + entry.watchDuration, 0),
      averageCompletionRate: data.watchHistory.reduce((sum, entry) => sum + entry.completionPercentage, 0) / data.watchHistory.length,
      
      // Category breakdown
      categoryBreakdown: data.videos.reduce((acc, video) => {
        const category = video.classification.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error loading statistics',
      error: error.message
    });
  }
});

module.exports = router;
