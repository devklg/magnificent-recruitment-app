const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Commission Details
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Commission must be greater than 0'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Commission amount must be a valid positive number'
    }
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: 'Talk Fusion Commission'
  },
  
  commissionType: {
    type: String,
    enum: [
      'talk_fusion',
      'recruitment_bonus',
      'team_bonus',
      'leadership_bonus',
      'monthly_bonus',
      'quarterly_bonus',
      'other'
    ],
    default: 'talk_fusion'
  },
  
  // Payout Information
  payoutDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  transactionId: {
    type: String,
    trim: true,
    sparse: true // Allows null/undefined but ensures uniqueness when present
  },
  
  // Verification System
  verified: {
    type: Boolean,
    default: false
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Additional Details
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Source tracking (how commission was earned)
  source: {
    prospectName: {
      type: String,
      trim: true
    },
    prospectEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    recruitmentSource: {
      type: String,
      enum: ['powerline', 'direct', 'referral', 'event', 'other'],
      default: 'powerline'
    }
  },
  
  // Display settings
  showInFeed: {
    type: Boolean,
    default: true
  },
  
  isPublic: {
    type: Boolean,
    default: false // Whether to show in public social proof
  },
  
  // System timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
commissionSchema.index({ userId: 1, createdAt: -1 });
commissionSchema.index({ verified: 1, createdAt: -1 });
commissionSchema.index({ commissionType: 1, payoutDate: -1 });
commissionSchema.index({ showInFeed: 1, verified: 1, createdAt: -1 });

// Virtual for formatted amount
commissionSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for time since payout
commissionSchema.virtual('timeSincePayout').get(function() {
  const now = new Date();
  const payout = this.payoutDate;
  const diffTime = Math.abs(now - payout);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Instance method to format for social proof display
commissionSchema.methods.toSocialProof = function() {
  return {
    amount: this.formattedAmount,
    description: this.description,
    promoterName: this.userName,
    timeAgo: this.timeSincePayout,
    type: this.commissionType,
    verified: this.verified
  };
};

// Instance method to mark as verified
commissionSchema.methods.verify = function(verifiedBy) {
  this.verified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get user's commission summary
commissionSchema.statics.getUserSummary = function(userId) {
  return this.aggregate([
    {
      $match: { userId: userId, verified: true }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        commissionCount: { $sum: 1 },
        averageCommission: { $avg: '$amount' },
        lastCommissionDate: { $max: '$payoutDate' },
        highestCommission: { $max: '$amount' }
      }
    }
  ]);
};

// Static method to get team commission statistics
commissionSchema.statics.getTeamStats = function(userIds, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        userId: { $in: userIds },
        verified: true,
        payoutDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        teamTotal: { $sum: '$amount' },
        teamCount: { $sum: 1 },
        teamAverage: { $avg: '$amount' },
        uniqueEarners: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        teamTotal: 1,
        teamCount: 1,
        teamAverage: 1,
        uniqueEarnersCount: { $size: '$uniqueEarners' }
      }
    }
  ]);
};

// Static method to get commission leaderboard
commissionSchema.statics.getLeaderboard = function(timeframe = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        verified: true,
        payoutDate: { $gte: startDate },
        isPublic: true
      }
    },
    {
      $group: {
        _id: '$userId',
        userName: { $first: '$userName' },
        totalEarnings: { $sum: '$amount' },
        commissionCount: { $sum: 1 },
        averageCommission: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalEarnings: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Pre-save middleware
commissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure amount is rounded to 2 decimal places
  if (this.amount) {
    this.amount = Math.round(this.amount * 100) / 100;
  }
  
  next();
});

// Post-save middleware for real-time updates
commissionSchema.post('save', function(doc) {
  if (doc.verified && doc.showInFeed) {
    // Trigger real-time feed update
    console.log(`Commission feed update: ${doc.userName} earned ${doc.formattedAmount}`);
    // TODO: Emit WebSocket event for real-time dashboard updates
  }
});

// Export the model
const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission;