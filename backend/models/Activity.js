const mongoose = require('mongoose');

// Discord-inspired Activity/Event Model
const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'recruit',
      'promotion',
      'achievement',
      'team_join',
      'team_leave',
      'level_up',
      'message_sent',
      'channel_created',
      'channel_deleted',
      'role_assigned',
      'role_removed',
      'user_banned',
      'user_unbanned',
      'user_kicked',
      'invite_created',
      'invite_used',
      'emoji_added',
      'emoji_removed',
      'team_updated',
      'points_earned',
      'streak_achieved',
      'milestone_reached'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    enum: ['User', 'Team', 'Channel', 'Role', 'Message']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  description: {
    type: String,
    maxlength: 1000
  },
  points: {
    type: Number,
    default: 0
  },
  experience: {
    type: Number,
    default: 0
  },
  metadata: {
    recruitmentSource: String,
    achievementName: String,
    achievementRarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
    },
    levelFrom: Number,
    levelTo: Number,
    pointsEarned: Number,
    streakCount: Number,
    milestoneType: String,
    milestoneValue: Number,
    roleChanges: [{
      role: String,
      action: {
        type: String,
        enum: ['added', 'removed']
      }
    }],
    channelChanges: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    teamChanges: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    inviteCode: String,
    banReason: String,
    kickReason: String,
    promotionFrom: String,
    promotionTo: String,
    customData: mongoose.Schema.Types.Mixed
  },
  visibility: {
    type: String,
    enum: ['public', 'team', 'private'],
    default: 'public'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [{
    type: String,
    trim: true
  }],
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total reactions
activitySchema.virtual('totalReactions').get(function() {
  return this.reactions.reduce((total, reaction) => total + reaction.count, 0);
});

// Virtual for formatted timestamp
activitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
});

// Method to add reaction
activitySchema.methods.addReaction = function(emoji, userId) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) {
    reaction = {
      emoji,
      users: [],
      count: 0
    };
    this.reactions.push(reaction);
  }
  
  if (!reaction.users.includes(userId)) {
    reaction.users.push(userId);
    reaction.count += 1;
  }
  
  return this.save();
};

// Method to remove reaction
activitySchema.methods.removeReaction = function(emoji, userId) {
  const reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (reaction) {
    reaction.users = reaction.users.filter(id => id.toString() !== userId.toString());
    reaction.count = reaction.users.length;
    
    if (reaction.count === 0) {
      this.reactions = this.reactions.filter(r => r.emoji !== emoji);
    }
  }
  
  return this.save();
};

// Static method to get activity feed
activitySchema.statics.getFeed = function(options = {}) {
  const {
    teamId,
    userId,
    type,
    visibility = 'public',
    limit = 50,
    skip = 0
  } = options;
  
  let query = { isDeleted: false };
  
  if (teamId) query.team = teamId;
  if (userId) query.user = userId;
  if (type) query.type = type;
  if (visibility) query.visibility = visibility;
  
  return this.find(query)
    .populate('user', 'username avatar stats')
    .populate('target')
    .populate('team', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user statistics
activitySchema.statics.getUserStats = function(userId, timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' },
        totalExperience: { $sum: '$experience' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get team activity stats
activitySchema.statics.getTeamStats = function(teamId, timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        team: mongoose.Types.ObjectId(teamId),
        createdAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        },
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' },
        users: { $addToSet: '$user' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        dailyStats: {
          $push: {
            date: '$_id.date',
            count: '$count',
            totalPoints: '$totalPoints',
            uniqueUsers: { $size: '$users' }
          }
        },
        totalCount: { $sum: '$count' },
        totalPoints: { $sum: '$totalPoints' }
      }
    },
    {
      $sort: { totalCount: -1 }
    }
  ]);
};

// Index for efficient queries
activitySchema.index({ team: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ visibility: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);