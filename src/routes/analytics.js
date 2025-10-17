const express = require('express');
const { query, validationResult } = require('express-validator');
const analyticsService = require('../services/analyticsService');
const { auth, isParent } = require('../middleware/auth');
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

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics data
// @access  Public
router.get('/dashboard', publicAuth, async (req, res) => {
  try {
    const dashboardData = await analyticsService.getDashboardData(req.user._id);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/daily
// @desc    Get daily analytics
// @access  Private
router.get('/daily',
  auth,
  [
    query('date').optional().isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();

      const dailyAnalytics = await analyticsService.calculateDailyAnalytics(req.user._id, targetDate);

      res.json({
        success: true,
        data: dailyAnalytics
      });

    } catch (error) {
      console.error('Daily analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get daily analytics'
      });
    }
  }
);

// @route   GET /api/analytics/weekly
// @desc    Get weekly analytics
// @access  Private
router.get('/weekly',
  auth,
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { startDate } = req.query;

      const weeklyAnalytics = await analyticsService.getWeeklyAnalytics(
        req.user._id, 
        startDate ? new Date(startDate) : null
      );

      res.json({
        success: true,
        data: weeklyAnalytics
      });

    } catch (error) {
      console.error('Weekly analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get weekly analytics'
      });
    }
  }
);

// @route   GET /api/analytics/productivity
// @desc    Get productivity scores and trends
// @access  Private
router.get('/productivity',
  auth,
  [
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const productivityData = [];

      // Get productivity scores for the last N days
      for (let i = parseInt(days) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayAnalytics = await analyticsService.calculateDailyAnalytics(req.user._id, date);
        
        productivityData.push({
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          productivityScore: dayAnalytics.productivityScore,
          totalWatchTime: dayAnalytics.totalWatchTime,
          educationalTime: dayAnalytics.categories.Educational + dayAnalytics.categories.News,
          entertainmentTime: dayAnalytics.categories.Entertainment + dayAnalytics.categories.Gaming + dayAnalytics.categories.Music + dayAnalytics.categories.Vlogs
        });
      }

      // Calculate trends
      const scores = productivityData.map(d => d.productivityScore);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      let trend = 'stable';
      if (scores.length >= 2) {
        const recentAvg = scores.slice(-3).reduce((sum, score) => sum + score, 0) / Math.min(3, scores.length);
        const earlierAvg = scores.slice(0, -3).reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length - 3);
        
        if (recentAvg > earlierAvg + 5) trend = 'improving';
        else if (recentAvg < earlierAvg - 5) trend = 'declining';
      }

      res.json({
        success: true,
        data: {
          daily: productivityData,
          summary: {
            averageScore: Math.round(averageScore),
            trend,
            totalDays: parseInt(days)
          }
        }
      });

    } catch (error) {
      console.error('Productivity analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get productivity analytics'
      });
    }
  }
);

// @route   GET /api/analytics/top-channels
// @desc    Get top channels by watch time
// @access  Private
router.get('/top-channels',
  auth,
  [
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const topChannels = await analyticsService.getTopChannels(req.user._id, parseInt(days));

      res.json({
        success: true,
        data: {
          channels: topChannels,
          period: `${days} days`
        }
      });

    } catch (error) {
      console.error('Top channels analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top channels analytics'
      });
    }
  }
);

// @route   GET /api/analytics/flagged-content
// @desc    Get flagged content analytics
// @access  Private
router.get('/flagged-content',
  auth,
  [
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { days = 7 } = req.query;

      const flaggedContent = await analyticsService.getContentFlags(req.user._id, parseInt(days));

      // Group by severity
      const summary = {
        high: flaggedContent.filter(item => item.severity === 'high').length,
        medium: flaggedContent.filter(item => item.severity === 'medium').length,
        low: flaggedContent.filter(item => item.severity === 'low').length,
        total: flaggedContent.length
      };

      res.json({
        success: true,
        data: {
          flaggedContent,
          summary,
          period: `${days} days`
        }
      });

    } catch (error) {
      console.error('Flagged content analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get flagged content analytics'
      });
    }
  }
);

// @route   GET /api/analytics/family
// @desc    Get family analytics (for parents)
// @access  Private (Parent only)
router.get('/family', auth, isParent, async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get all family members (children)
    const familyMembers = await User.find({ parentId: req.user._id });

    const familyAnalytics = [];

    for (const member of familyMembers) {
      const dashboardData = await analyticsService.getDashboardData(member._id);
      const flaggedContent = await analyticsService.getContentFlags(member._id, 7);

      familyAnalytics.push({
        user: {
          id: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar
        },
        analytics: dashboardData,
        flaggedContent: {
          count: flaggedContent.length,
          highSeverity: flaggedContent.filter(item => item.severity === 'high').length
        }
      });
    }

    res.json({
      success: true,
      data: {
        familyMembers: familyAnalytics,
        summary: {
          totalMembers: familyMembers.length,
          totalFlaggedContent: familyAnalytics.reduce((sum, member) => sum + member.flaggedContent.count, 0),
          highRiskContent: familyAnalytics.reduce((sum, member) => sum + member.flaggedContent.highSeverity, 0)
        }
      }
    });

  } catch (error) {
    console.error('Family analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family analytics'
    });
  }
});

// @route   GET /api/analytics/goals
// @desc    Get goal progress and achievements
// @access  Private
router.get('/goals', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    const goals = user.settings.dailyGoals;
    const today = new Date();
    
    // Get today's analytics
    const todayAnalytics = await analyticsService.calculateDailyAnalytics(req.user._id, today);
    
    // Calculate goal progress
    const educationalTime = todayAnalytics.categories.Educational + todayAnalytics.categories.News;
    const entertainmentTime = todayAnalytics.categories.Entertainment + todayAnalytics.categories.Gaming + todayAnalytics.categories.Music + todayAnalytics.categories.Vlogs;
    
    const goalProgress = {
      educational: {
        target: goals.educational,
        achieved: educationalTime,
        percentage: Math.round((educationalTime / goals.educational) * 100),
        status: educationalTime >= goals.educational ? 'completed' : 'in_progress'
      },
      entertainment: {
        target: goals.entertainment,
        achieved: entertainmentTime,
        percentage: Math.round((entertainmentTime / goals.entertainment) * 100),
        status: entertainmentTime >= goals.entertainment ? 'completed' : 'in_progress'
      },
      total: {
        target: goals.total,
        achieved: todayAnalytics.totalWatchTime,
        percentage: Math.round((todayAnalytics.totalWatchTime / goals.total) * 100),
        status: todayAnalytics.totalWatchTime >= goals.total ? 'completed' : 'in_progress'
      }
    };

    // Check for achievements
    const achievements = [];
    if (goalProgress.educational.status === 'completed') {
      achievements.push({
        type: 'daily_educational_goal',
        title: 'Educational Goal Achieved!',
        description: `You've reached your daily educational content goal of ${goals.educational} minutes.`
      });
    }
    
    if (todayAnalytics.productivityScore >= 80) {
      achievements.push({
        type: 'high_productivity',
        title: 'Productivity Master!',
        description: `Amazing! You achieved a productivity score of ${todayAnalytics.productivityScore}%.`
      });
    }

    res.json({
      success: true,
      data: {
        goals: goalProgress,
        achievements,
        todayStats: {
          productivityScore: todayAnalytics.productivityScore,
          totalWatchTime: todayAnalytics.totalWatchTime,
          videosWatched: todayAnalytics.videosWatched
        }
      }
    });

  } catch (error) {
    console.error('Goals analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get goals analytics'
    });
  }
});

module.exports = router;