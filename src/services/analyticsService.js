const WatchHistory = require('../models/WatchHistory');
const Video = require('../models/Video');

class AnalyticsService {
  
  // Calculate daily analytics for a user
  async calculateDailyAnalytics(userId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const watchHistory = await WatchHistory
      .find({
        userId,
        watchedAt: { $gte: startOfDay, $lte: endOfDay }
      })
      .populate('videoId');

    const analytics = {
      date: startOfDay,
      totalWatchTime: 0, // in minutes
      categories: {
        Educational: 0,
        Entertainment: 0,
        Gaming: 0,
        Music: 0,
        News: 0,
        Vlogs: 0
      },
      ageRatings: {
        'All Ages': 0,
        '7+': 0,
        '13+': 0,
        '18+': 0
      },
      videosWatched: watchHistory.length,
      productivityScore: 0
    };

    // Calculate category and age rating breakdowns
    watchHistory.forEach(entry => {
      const watchMinutes = entry.watchDuration / 60;
      analytics.totalWatchTime += watchMinutes;

      if (entry.videoId?.classification) {
        const category = entry.videoId.classification.category;
        const ageRating = entry.videoId.classification.ageRating;

        if (analytics.categories[category] !== undefined) {
          analytics.categories[category] += watchMinutes;
        }

        if (analytics.ageRatings[ageRating] !== undefined) {
          analytics.ageRatings[ageRating] += watchMinutes;
        }
      }
    });

    // Calculate productivity score (0-100)
    const educationalTime = analytics.categories.Educational + analytics.categories.News;
    const entertainmentTime = analytics.categories.Entertainment + analytics.categories.Gaming + analytics.categories.Music + analytics.categories.Vlogs;
    
    if (analytics.totalWatchTime > 0) {
      analytics.productivityScore = Math.round((educationalTime / analytics.totalWatchTime) * 100);
    }

    return analytics;
  }

  // Get weekly analytics
  async getWeeklyAnalytics(userId, startDate = null) {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 6); // 7 days including today
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const dailyAnalytics = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const dayAnalytics = await this.calculateDailyAnalytics(userId, date);
      dailyAnalytics.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        ...dayAnalytics
      });
    }

    // Calculate weekly totals
    const weeklyTotals = {
      totalWatchTime: 0,
      categories: {
        Educational: 0,
        Entertainment: 0,
        Gaming: 0,
        Music: 0,
        News: 0,
        Vlogs: 0
      },
      ageRatings: {
        'All Ages': 0,
        '7+': 0,
        '13+': 0,
        '18+': 0
      },
      videosWatched: 0,
      averageProductivityScore: 0
    };

    dailyAnalytics.forEach(day => {
      weeklyTotals.totalWatchTime += day.totalWatchTime;
      weeklyTotals.videosWatched += day.videosWatched;
      
      Object.keys(weeklyTotals.categories).forEach(category => {
        weeklyTotals.categories[category] += day.categories[category];
      });
      
      Object.keys(weeklyTotals.ageRatings).forEach(rating => {
        weeklyTotals.ageRatings[rating] += day.ageRatings[rating];
      });
    });

    // Calculate average productivity score
    const validDays = dailyAnalytics.filter(day => day.totalWatchTime > 0);
    if (validDays.length > 0) {
      weeklyTotals.averageProductivityScore = Math.round(
        validDays.reduce((sum, day) => sum + day.productivityScore, 0) / validDays.length
      );
    }

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      daily: dailyAnalytics,
      totals: weeklyTotals
    };
  }

  // Get dashboard data
  async getDashboardData(userId) {
    const today = new Date();
    const todayAnalytics = await this.calculateDailyAnalytics(userId, today);
    const weeklyAnalytics = await this.getWeeklyAnalytics(userId);

    // Get recent watch history
    const recentWatchHistory = await WatchHistory
      .find({ userId })
      .populate('videoId')
      .sort({ watchedAt: -1 })
      .limit(10);

    // Get goal progress (assuming user has daily goals)
    const user = await require('../models/User').findById(userId);
    const goals = user?.settings?.dailyGoals || {
      educational: 60,
      entertainment: 120,
      total: 180
    };

    const goalProgress = {
      educational: {
        target: goals.educational,
        achieved: todayAnalytics.categories.Educational + todayAnalytics.categories.News,
        percentage: Math.round(((todayAnalytics.categories.Educational + todayAnalytics.categories.News) / goals.educational) * 100)
      },
      entertainment: {
        target: goals.entertainment,
        achieved: todayAnalytics.categories.Entertainment + todayAnalytics.categories.Gaming + todayAnalytics.categories.Music + todayAnalytics.categories.Vlogs,
        percentage: Math.round(((todayAnalytics.categories.Entertainment + todayAnalytics.categories.Gaming + todayAnalytics.categories.Music + todayAnalytics.categories.Vlogs) / goals.entertainment) * 100)
      },
      total: {
        target: goals.total,
        achieved: todayAnalytics.totalWatchTime,
        percentage: Math.round((todayAnalytics.totalWatchTime / goals.total) * 100)
      }
    };

    return {
      today: todayAnalytics,
      weekly: weeklyAnalytics,
      recentWatchHistory: recentWatchHistory.map(entry => ({
        id: entry._id,
        video: entry.videoId,
        watchDuration: entry.watchDuration,
        completionPercentage: entry.completionPercentage,
        watchedAt: entry.watchedAt
      })),
      goalProgress
    };
  }

  // Get top channels by watch time
  async getTopChannels(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          watchedAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'videos',
          localField: 'videoId',
          foreignField: '_id',
          as: 'video'
        }
      },
      {
        $unwind: '$video'
      },
      {
        $group: {
          _id: '$video.channelId',
          channelTitle: { $first: '$video.channelTitle' },
          totalWatchTime: { $sum: '$watchDuration' },
          videoCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalWatchTime: -1 }
      },
      {
        $limit: 10
      }
    ];

    const topChannels = await WatchHistory.aggregate(pipeline);

    return topChannels.map(channel => ({
      channelId: channel._id,
      channelTitle: channel.channelTitle,
      totalWatchTime: Math.round(channel.totalWatchTime / 60), // Convert to minutes
      videoCount: channel.videoCount
    }));
  }

  // Get content flags and warnings
  async getContentFlags(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const flaggedContent = await WatchHistory
      .find({
        userId,
        watchedAt: { $gte: startDate }
      })
      .populate({
        path: 'videoId',
        match: {
          'classification.flags': { $exists: true, $ne: [] }
        }
      })
      .sort({ watchedAt: -1 });

    return flaggedContent
      .filter(entry => entry.videoId)
      .map(entry => ({
        id: entry._id,
        video: entry.videoId,
        flags: entry.videoId.classification.flags,
        watchedAt: entry.watchedAt,
        severity: this.calculateSeverity(entry.videoId.classification.flags)
      }));
  }

  // Calculate severity based on flags
  calculateSeverity(flags) {
    if (flags.includes('violence') || flags.includes('adult_content')) {
      return 'high';
    } else if (flags.includes('language') || flags.includes('inappropriate')) {
      return 'medium';
    }
    return 'low';
  }
}

module.exports = new AnalyticsService();