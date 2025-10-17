const express = require('express');
const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');
const User = require('../models/User');

const router = express.Router();

// Get test user helper
async function getTestUser() {
  const testUser = await User.findOne({ email: 'test@example.com' });
  if (!testUser) {
    throw new Error('Test user not found');
  }
  return testUser;
}

// @route   GET /api/videos-public/recent
// @desc    Get recent videos for dashboard (public)
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const testUser = await getTestUser();

    // Get recent watch history with video details
    const recentVideos = await WatchHistory
      .find({ userId: testUser._id })
      .populate('videoId')
      .sort({ watchedAt: -1 })
      .limit(parseInt(limit));

    // Format for frontend
    const formattedVideos = recentVideos
      .filter(entry => entry.videoId) // Filter out null videoIds
      .map(entry => ({
        id: entry._id,
        title: entry.videoId.title || 'Unknown Video',
        thumbnail: entry.videoId.thumbnails?.medium?.url || entry.videoId.thumbnails?.default?.url || '',
        videoUrl: `https://www.youtube.com/watch?v=${entry.videoId.videoId}`,
        watchedAt: entry.watchedAt,
        timestamp: entry.watchedAt,
        duration: entry.duration || entry.videoId.duration || 0,
        category: entry.videoId.classification?.category || 'Other',
        ageRating: entry.videoId.classification?.ageRating || 'All Ages',
        completionPercentage: entry.completionPercentage || 0
      }));

    res.json({
      success: true,
      data: {
        videos: formattedVideos,
        total: formattedVideos.length
      }
    });
  } catch (error) {
    console.error('Error fetching recent videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent videos',
      error: error.message
    });
  }
});

// @route   GET /api/videos-public/flagged
// @desc    Get flagged videos (public)
// @access  Public
router.get('/flagged', async (req, res) => {
  try {
    const { page = 1, limit = 20, severity } = req.query;

    // Build query for flagged videos
    let query = {
      'classification.flagged': { $exists: true, $ne: [] }
    };

    if (severity) {
      query['classification.flagged.severity'] = severity;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const flaggedVideos = await Video
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'classification.processedAt': -1 });

    const total = await Video.countDocuments(query);

    // Format for frontend
    const formattedVideos = flaggedVideos.map(video => ({
      id: video._id,
      videoId: video.videoId,
      title: video.title,
      channel: video.channelTitle,
      thumbnail: video.thumbnails?.medium?.url || video.thumbnails?.default?.url || '',
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      flags: video.classification?.flags || [],
      flaggedInstances: video.classification?.flagged || [],
      processedAt: video.classification?.processedAt
    }));

    res.json({
      success: true,
      data: {
        videos: formattedVideos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching flagged videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flagged videos',
      error: error.message
    });
  }
});

// @route   POST /api/videos-public/unflag
// @desc    Mark a video as safe (public)
// @access  Public
router.post('/unflag', async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    const video = await Video.findOne({ videoId });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Clear all flags
    video.classification.flags = [];
    
    // Mark all flagged instances as resolved
    if (video.classification.flagged) {
      video.classification.flagged = video.classification.flagged.map(flag => ({
        ...flag.toObject(),
        status: 'resolved',
        resolvedAt: new Date()
      }));
    }

    await video.save();

    res.json({
      success: true,
      message: 'Video marked as safe',
      data: { videoId: video.videoId }
    });
  } catch (error) {
    console.error('Error marking video as safe:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking video as safe',
      error: error.message
    });
  }
});

module.exports = router;

