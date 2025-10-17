const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  youtubeVideoId: {
    type: String,
    required: true
  },
  watchDuration: {
    type: Number, // seconds watched
    required: true,
    min: 0
  },
  videoDuration: {
    type: Number, // total video duration in seconds
    required: true
  },
  completionPercentage: {
    type: Number, // 0-100
    default: 0
  },
  watchedAt: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  source: {
    type: String,
    enum: ['chrome_extension', 'mobile_app', 'web_app'],
    default: 'web_app'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
watchHistorySchema.index({ userId: 1, watchedAt: -1 });
watchHistorySchema.index({ youtubeVideoId: 1 });
watchHistorySchema.index({ sessionId: 1 });

// Pre-save hook to calculate completion percentage
watchHistorySchema.pre('save', function(next) {
  if (this.watchDuration && this.videoDuration) {
    this.completionPercentage = Math.min(
      Math.round((this.watchDuration / this.videoDuration) * 100),
      100
    );
  }
  next();
});

// Virtual for formatted watch time
watchHistorySchema.virtual('formattedWatchTime').get(function() {
  const minutes = Math.floor(this.watchDuration / 60);
  const seconds = this.watchDuration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

module.exports = mongoose.model('WatchHistory', watchHistorySchema);