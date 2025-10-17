const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'parent', 'child'],
    default: 'user'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  settings: {
    dailyGoals: {
      educational: { type: Number, default: 60 }, // minutes
      entertainment: { type: Number, default: 120 },
      total: { type: Number, default: 180 }
    },
    notifications: {
      goalReminders: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      flaggedContent: { type: Boolean, default: true }
    },
    parental: {
      ageRestrictions: {
        type: [String],
        enum: ['All Ages', '7+', '13+', '18+'],
        default: ['All Ages', '7+', '13+', '18+']
      },
      contentFilters: {
        type: [String],
        enum: ['Educational', 'Entertainment', 'Gaming', 'Music', 'News', 'Vlogs'],
        default: []
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ parentId: 1 });

module.exports = mongoose.model('User', userSchema);