const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');
const youtubeService = require('../services/youtubeService');
const classificationService = require('../services/classificationService');
const { auth } = require('../middleware/auth');
const { publicAuth } = require('../middleware/publicAuth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/videos/classify
// @desc    Classify a YouTube video
// @access  Private
router.post('/classify',
  auth,
  [
    body('videoUrl').notEmpty().withMessage('Video URL is required'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { videoUrl } = req.body;

      // Extract video ID from URL
      const videoId = youtubeService.extractVideoId(videoUrl);

      // Check if video already exists in database
      let video = await Video.findOne({ videoId });

      if (!video) {
        // Fetch video details from YouTube
        const videoDetails = await youtubeService.getVideoDetails(videoId);

        // Classify the video
        const classification = await classificationService.classifyVideo(videoDetails);

        // Save video to database
        video = new Video({
          ...videoDetails,
          classification
        });
        await video.save();
      }

      res.json({
        success: true,
        message: 'Video classified successfully',
        data: { video }
      });

    } catch (error) {
      console.error('Video classification error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to classify video'
      });
    }
  }
);

// @route   GET /api/videos/:videoId
// @desc    Get video details with classification
// @access  Private
router.get('/:videoId',
  auth,
  [
    param('videoId').isLength({ min: 11, max: 11 }).withMessage('Invalid video ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { videoId } = req.params;

      let video = await Video.findOne({ videoId });

      if (!video) {
        // Fetch and classify video if not in database
        const videoDetails = await youtubeService.getVideoDetails(videoId);
        const classification = await classificationService.classifyVideo(videoDetails);

        video = new Video({
          ...videoDetails,
          classification
        });
        await video.save();
      }

      res.json({
        success: true,
        data: { video }
      });

    } catch (error) {
      console.error('Get video error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get video details'
      });
    }
  }
);

// @route   POST /api/videos/watch-history
// @desc    Log a video watch
// @access  Private
router.post('/watch-history',
  auth,
  [
    body('videoId').notEmpty().withMessage('Video ID is required'),
    body('watchDuration').isNumeric().withMessage('Watch duration must be a number'),
    body('videoDuration').isNumeric().withMessage('Video duration must be a number')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { videoId, watchDuration, videoDuration, source = 'web_app' } = req.body;

      // Get or create video record
      let video = await Video.findOne({ videoId });

      if (!video) {
        const videoDetails = await youtubeService.getVideoDetails(videoId);
        const classification = await classificationService.classifyVideo(videoDetails);

        video = new Video({
          ...videoDetails,
          classification
        });
        await video.save();
      }

      // Create watch history entry
      const watchHistory = new WatchHistory({
        userId: req.user._id,
        videoId: video._id,
        youtubeVideoId: videoId,
        watchDuration: Math.max(0, watchDuration),
        videoDuration: Math.max(1, videoDuration),
        source
      });

      await watchHistory.save();

      // Populate video details for response
      await watchHistory.populate('videoId');

      res.json({
        success: true,
        message: 'Watch history logged successfully',
        data: { 
          watchHistory,
          video: video
        }
      });

    } catch (error) {
      console.error('Watch history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to log watch history'
      });
    }
  }
);

// @route   GET /api/videos/watch-history
// @desc    Get user's watch history
// @access  Private
router.get('/watch-history',
  auth,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category,
        startDate,
        endDate 
      } = req.query;

      // Build query
      const query = { userId: req.user._id };

      // Date range filter
      if (startDate || endDate) {
        query.watchedAt = {};
        if (startDate) query.watchedAt.$gte = new Date(startDate);
        if (endDate) query.watchedAt.$lte = new Date(endDate);
      }

      // Get watch history with video details
      let watchHistory = await WatchHistory
        .find(query)
        .populate('videoId')
        .sort({ watchedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Filter by category if specified
      if (category) {
        watchHistory = watchHistory.filter(entry => 
          entry.videoId?.classification?.category === category
        );
      }

      // Get total count
      const total = await WatchHistory.countDocuments(query);

      res.json({
        success: true,
        data: {
          watchHistory,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get watch history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get watch history'
      });
    }
  }
);

// @route   GET /api/videos/recent
// @desc    Get recent videos for dashboard
// @access  Public
router.get('/recent',
  publicAuth,
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Get recent watch history with video details
      const recentVideos = await WatchHistory
        .find({ userId: req.user._id })
        .populate('videoId')
        .sort({ watchedAt: -1 })
        .limit(parseInt(limit));

      // Format for frontend
      const formattedVideos = recentVideos.map(entry => ({
        id: entry._id,
        title: entry.videoId?.title || 'Unknown Video',
        channel: entry.videoId?.channelTitle || 'Unknown Channel',
        category: entry.videoId?.classification?.category || 'Entertainment',
        duration: entry.videoId?.duration || '0:00',
        ageRating: entry.videoId?.classification?.ageRating || 'All Ages',
        timestamp: entry.watchedAt,
        watchDuration: entry.watchDuration,
        completionPercentage: entry.completionPercentage,
        thumbnail: entry.videoId?.thumbnails?.medium || '/placeholder.svg',
        videoUrl: `https://www.youtube.com/watch?v=${entry.youtubeVideoId}`
      }));

      res.json({
        success: true,
        data: { videos: formattedVideos }
      });

    } catch (error) {
      console.error('Get recent videos error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent videos'
      });
    }
  }
);

// @route   POST /api/videos/flag
// @desc    Flag a video as inappropriate
// @access  Private
router.post('/flag',
  auth,
  [
    body('videoId').notEmpty().withMessage('Video ID is required'),
    body('reason').notEmpty().withMessage('Flag reason is required'),
    body('severity').isIn(['low', 'medium', 'high']).withMessage('Invalid severity level')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { videoId, reason, severity = 'medium' } = req.body;

      // Find the video
      const video = await Video.findOne({ videoId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Update video classification with flag
      video.classification.flags = [...(video.classification.flags || []), 'inappropriate'];
      
      // Add flag information
      if (!video.classification.flagged) {
        video.classification.flagged = [];
      }
      
      video.classification.flagged.push({
        userId: req.user._id,
        reason,
        severity,
        flaggedAt: new Date(),
        status: 'active'
      });

      await video.save();

      res.json({
        success: true,
        message: 'Video flagged successfully',
        data: { video }
      });

    } catch (error) {
      console.error('Flag video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to flag video'
      });
    }
  }
);

// @route   GET /api/videos/flagged
// @desc    Get flagged videos
// @access  Public
router.get('/flagged',
  publicAuth,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, severity } = req.query;

      // Build query for flagged videos
      let query = {
        'classification.flagged': { $exists: true, $ne: [] }
      };

      if (severity) {
        query['classification.flagged.severity'] = severity;
      }

      const flaggedVideos = await Video
        .find(query)
        .sort({ 'classification.flagged.flaggedAt': -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Format for frontend
      const formattedVideos = flaggedVideos.map(video => {
        const latestFlag = video.classification.flagged[video.classification.flagged.length - 1];
        return {
          id: video._id,
          videoId: video.videoId,
          title: video.title,
          channel: video.channelTitle,
          description: video.description,
          duration: video.duration,
          ageRating: video.classification.ageRating,
          severity: latestFlag.severity,
          reason: latestFlag.reason,
          flaggedAt: latestFlag.flaggedAt,
          thumbnail: video.thumbnails?.medium || '/placeholder.svg',
          videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          viewCount: video.viewCount
        };
      });

      const total = await Video.countDocuments(query);

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
      console.error('Get flagged videos error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get flagged videos'
      });
    }
  }
);

// @route   POST /api/videos/unflag
// @desc    Remove flag from a video
// @access  Private
router.post('/unflag',
  auth,
  [
    body('videoId').notEmpty().withMessage('Video ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { videoId } = req.body;

      const video = await Video.findOne({ videoId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Remove flags
      video.classification.flags = (video.classification.flags || []).filter(flag => flag !== 'inappropriate');
      
      // Mark flags as resolved
      if (video.classification.flagged) {
        video.classification.flagged.forEach(flag => {
          if (flag.userId.toString() === req.user._id.toString()) {
            flag.status = 'resolved';
            flag.resolvedAt = new Date();
          }
        });
      }

      await video.save();

      res.json({
        success: true,
        message: 'Video unflagged successfully',
        data: { video }
      });

    } catch (error) {
      console.error('Unflag video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unflag video'
      });
    }
  }
);

// @route   POST /api/videos/batch-classify
// @desc    Classify multiple videos
// @access  Private
router.post('/batch-classify',
  auth,
  [
    body('videoIds').isArray().withMessage('Video IDs must be an array'),
    body('videoIds.*').isLength({ min: 11, max: 11 }).withMessage('Invalid video ID format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { videoIds } = req.body;

      if (videoIds.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 videos can be classified at once'
        });
      }

      const results = [];

      for (const videoId of videoIds) {
        try {
          let video = await Video.findOne({ videoId });

          if (!video) {
            const videoDetails = await youtubeService.getVideoDetails(videoId);
            const classification = await classificationService.classifyVideo(videoDetails);

            video = new Video({
              ...videoDetails,
              classification
            });
            await video.save();
          }

          results.push({
            videoId,
            success: true,
            video
          });
        } catch (error) {
          results.push({
            videoId,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: 'Batch classification completed',
        data: { results }
      });

    } catch (error) {
      console.error('Batch classification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to classify videos'
      });
    }
  }
);

module.exports = router;