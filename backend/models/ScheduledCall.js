const mongoose = require('mongoose');

const scheduledCallSchema = new mongoose.Schema({
  // Promoter Information
  promoterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promoterName: {
    type: String,
    required: true
  },
  promoterPhone: {
    type: String,
    required: true
  },
  
  // Prospect Information
  prospectName: {
    type: String,
    required: true,
    trim: true
  },
  prospectPhone: {
    type: String,
    required: true,
    trim: true
  },
  prospectEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  // Scheduling Details
  preferredDateTime: {
    type: Date,
    required: true
  },
  confirmedDateTime: {
    type: Date,
    default: null
  },
  timeZone: {
    type: String,
    required: true,
    enum: ['PST', 'EST', 'CST', 'MST', 'UTC']
  },
  
  // Leadership Assignment
  leaderPreference: {
    type: String,
    enum: ['kevin', 'paul', 'randy', 'any'],
    default: 'kevin'
  },
  assignedLeader: {
    type: String,
    enum: ['kevin', 'paul', 'randy'],
    default: null
  },
  
  // Call Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  
  // Notes and Communication
  promoterNotes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  adminNotes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Call Results (post-call tracking)
  callResult: {
    type: String,
    enum: ['enrolled', 'follow-up', 'not-interested', 'reschedule'],
    default: null
  },
  callNotes: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  // Meeting Platform Details
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'phone', 'teams', 'other'],
    default: 'phone'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  
  // Follow-up tracking
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null
  },
  
  // System tracking
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
scheduledCallSchema.index({ promoterId: 1, createdAt: -1 });
scheduledCallSchema.index({ status: 1, confirmedDateTime: 1 });
scheduledCallSchema.index({ assignedLeader: 1, status: 1 });

// Virtual for formatted call time
scheduledCallSchema.virtual('formattedCallTime').get(function() {
  const callTime = this.confirmedDateTime || this.preferredDateTime;
  return callTime ? callTime.toLocaleDateString() + ' ' + callTime.toLocaleTimeString() : null;
});

// Method to check if call is upcoming
scheduledCallSchema.methods.isUpcoming = function() {
  const callTime = this.confirmedDateTime || this.preferredDateTime;
  return callTime && callTime > new Date() && this.status === 'confirmed';
};

// Method to mark call as completed
scheduledCallSchema.methods.markCompleted = function(result, notes) {
  this.status = 'completed';
  this.callResult = result;
  this.callNotes = notes;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get upcoming calls for a leader
scheduledCallSchema.statics.getUpcomingCallsForLeader = function(leader) {
  return this.find({
    assignedLeader: leader,
    status: 'confirmed',
    confirmedDateTime: { $gte: new Date() }
  }).sort({ confirmedDateTime: 1 }).populate('promoterId', 'name email phone');
};

// Static method to get call statistics
scheduledCallSchema.statics.getCallStats = function(timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware to update the updatedAt field
scheduledCallSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the model
const ScheduledCall = mongoose.model('ScheduledCall', scheduledCallSchema);

module.exports = ScheduledCall;