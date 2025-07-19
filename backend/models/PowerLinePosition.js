const mongoose = require('mongoose');

const powerLinePositionSchema = new mongoose.Schema({
  // Core Position Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user can only have one position
  },
  
  position: {
    type: Number,
    required: true,
    unique: true, // No duplicate positions
    min: 1
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    default: 'PowerLine Member'
  },
  
  // Sponsor/Referral Information
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  sponsorName: {
    type: String,
    trim: true,
    default: null
  },
  
  // Position Status
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Tracking Information
  joinedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  source: {
    type: String,
    enum: [
      'powerline_enrollment',
      'direct_invitation', 
      'funnel_capture',
      'event_signup',
      'manual_admin',
      'imported'
    ],
    default: 'powerline_enrollment'
  },
  
  // Contact Information (for prospects)
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true
    }
  },
  
  // Progression Tracking
  progression: {
    hasEnrolled: {
      type: Boolean,
      default: false
    },
    enrollmentDate: {
      type: Date,
      default: null
    },
    becamePromoter: {
      type: Boolean,
      default: false
    },
    promoterDate: {
      type: Date,
      default: null
    }
  },
  
  // Tree Structure Information
  treeLevel: {
    type: Number,
    default: function() {
      // Calculate tree level based on position
      return Math.floor(Math.log2(this.position));
    }
  },
  
  parentPosition: {
    type: Number,
    default: function() {
      // Calculate parent position in binary tree
      return this.position > 1 ? Math.floor(this.position / 2) : null;
    }
  },
  
  // Activity Tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  activityCount: {
    type: Number,
    default: 0
  },
  
  // Notes and Admin Information
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  adminNotes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Display Settings
  isVisible: {
    type: Boolean,
    default: true
  },
  
  showInQueue: {
    type: Boolean,
    default: true
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
powerLinePositionSchema.index({ position: 1 }, { unique: true });
powerLinePositionSchema.index({ userId: 1 }, { unique: true });
powerLinePositionSchema.index({ sponsorId: 1 });
powerLinePositionSchema.index({ status: 1, joinedAt: -1 });
powerLinePositionSchema.index({ joinedAt: -1 });
powerLinePositionSchema.index({ treeLevel: 1, position: 1 });

// Virtual for time in queue
powerLinePositionSchema.virtual('timeInQueue').get(function() {
  const now = new Date();
  const joined = this.joinedAt;
  const diffTime = Math.abs(now - joined);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h`;
  return 'Just joined';
});

// Virtual for formatted position display
powerLinePositionSchema.virtual('formattedPosition').get(function() {
  return `#${this.position.toLocaleString()}`;
});

// Virtual for child positions in binary tree
powerLinePositionSchema.virtual('childPositions').get(function() {
  return [this.position * 2, this.position * 2 + 1];
});

// Virtual for tree path (breadcrumb)
powerLinePositionSchema.virtual('treePath').get(function() {
  const path = [];
  let current = this.position;
  
  while (current > 1) {
    path.unshift(current);
    current = Math.floor(current / 2);
  }
  path.unshift(1); // Root position
  
  return path;
});

// Instance method to get position info for display
powerLinePositionSchema.methods.toDisplayInfo = function() {
  return {
    position: this.position,
    formattedPosition: this.formattedPosition,
    displayName: this.displayName,
    timeInQueue: this.timeInQueue,
    status: this.status,
    treeLevel: this.treeLevel,
    hasUser: !!this.userId,
    joinedAt: this.joinedAt
  };
};

// Instance method to advance to next status
powerLinePositionSchema.methods.advanceStatus = function(newStatus, notes) {
  this.status = newStatus;
  this.lastActivity = new Date();
  this.activityCount += 1;
  
  if (notes) {
    this.notes = notes;
  }
  
  // Track progression milestones
  if (newStatus === 'enrolled' && !this.progression.hasEnrolled) {
    this.progression.hasEnrolled = true;
    this.progression.enrollmentDate = new Date();
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to calculate queue statistics
powerLinePositionSchema.methods.getQueueStats = async function() {
  const Position = this.constructor;
  
  const [ahead, behind, total] = await Promise.all([
    Position.countDocuments({ position: { $lt: this.position } }),
    Position.countDocuments({ position: { $gt: this.position } }),
    Position.countDocuments()
  ]);
  
  return {
    positionsAhead: ahead,
    positionsBehind: behind,
    totalPositions: total,
    percentile: total > 0 ? Math.round((ahead / total) * 100) : 0
  };
};

// Static method to get next available position
powerLinePositionSchema.statics.getNextPosition = async function() {
  const lastPosition = await this.findOne().sort({ position: -1 });
  return lastPosition ? lastPosition.position + 1 : 1;
};

// Static method to get tree structure for visualization
powerLinePositionSchema.statics.getTreeStructure = function(startPosition = 1, levels = 3) {
  const endPosition = startPosition + Math.pow(2, levels) - 1;
  
  return this.find({
    position: { $gte: startPosition, $lte: endPosition }
  })
  .sort({ position: 1 })
  .populate('userId', 'name email')
  .populate('sponsorId', 'name email');
};

// Static method to get queue growth statistics
powerLinePositionSchema.statics.getGrowthStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        joinedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$joinedAt' },
          month: { $month: '$joinedAt' },
          day: { $dayOfMonth: '$joinedAt' }
        },
        count: { $sum: 1 },
        positions: { $push: '$position' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to find positions by sponsor
powerLinePositionSchema.statics.findBySponsor = function(sponsorId) {
  return this.find({ sponsorId })
    .populate('userId', 'name email phone')
    .sort({ position: 1 });
};

// Pre-save middleware
powerLinePositionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate tree level
  if (this.position) {
    this.treeLevel = Math.floor(Math.log2(this.position));
  }
  
  next();
});

// Post-save middleware for real-time updates
powerLinePositionSchema.post('save', function(doc) {
  if (doc.isNew) {
    console.log(`New PowerLine position #${doc.position} created for ${doc.displayName}`);
    // TODO: Emit WebSocket event for real-time queue updates
  }
});

// Export the model
const PowerLinePosition = mongoose.model('PowerLinePosition', powerLinePositionSchema);

module.exports = PowerLinePosition;