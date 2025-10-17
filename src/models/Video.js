const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  channelTitle: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  duration: {
    type: String, // ISO 8601 format (PT4M13S)
    required: true
  },
  durationSeconds: {
    type: Number, // Duration in seconds for calculations
    required: true
  },
  thumbnails: {
    default: String,
    medium: String,
    high: String
  },
  publishedAt: {
    type: Date,
    required: true
  },
  tags: [{
    type: String
  }],
  categoryId: {
    type: String,
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  classification: {
    category: {
      type: String,
      enum: ['Educational', 'Entertainment', 'Gaming', 'Music', 'News', 'Vlogs'],
      required: true
    },
    ageRating: {
      type: String,
      enum: ['All Ages', '7+', '13+', '18+'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    flags: [{
      type: String,
      enum: ['violence', 'language', 'adult_content', 'inappropriate']
    }],
    flagged: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      flaggedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
      },
      resolvedAt: {
        type: Date
      }
    }],
    processedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
videoSchema.index({ videoId: 1 });
videoSchema.index({ 'classification.category': 1 });
videoSchema.index({ 'classification.ageRating': 1 });
videoSchema.index({ channelId: 1 });

// Method to convert ISO 8601 duration to seconds
videoSchema.methods.parseDuration = function() {
  const duration = this.duration;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 0;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
};

// Pre-save hook to calculate duration in seconds
videoSchema.pre('save', function(next) {
  if (this.duration && !this.durationSeconds) {
    this.durationSeconds = this.parseDuration();
  }
  next();
});

module.exports = mongoose.model('Video', videoSchema);