// MARCUS/JAMES: Model exports for PowerLine recruitment platform

const User = require('./User');
const Team = require('./Team');
const Activity = require('./Activity');
const Commission = require('./Commission');
const PowerLinePosition = require('./PowerLinePosition');
const ScheduledCall = require('./ScheduledCall');

module.exports = {
  User,
  Team,
  Activity,
  Commission,
  PowerLinePosition,
  ScheduledCall
};

// Model relationships and hooks

// Update team stats when user joins/leaves
User.schema.post('save', async function(doc) {
  if (this.isModified('teams')) {
    // Update team member counts
    for (const teamMembership of doc.teams) {
      const Team = require('./Team');
      const team = await Team.findById(teamMembership.team);
      if (team) {
        team.stats.totalMembers = team.members.length;
        await team.save();
      }
    }
  }
});

// Update user commission totals when commission is verified
Commission.schema.post('save', async function(doc) {
  if (doc.verified && this.isModified('verified')) {
    const User = require('./User');
    const user = await User.findById(doc.userId);
    
    if (user) {
      // Recalculate total commissions for user
      const totalCommissions = await Commission.aggregate([
        { $match: { userId: doc.userId, verified: true } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      user.totalCommissions = totalCommissions[0]?.total || 0;
      user.lastCommissionDate = new Date();
      await user.save();
      
      // Create activity for verified commission
      const Activity = require('./Activity');
      await Activity.create({
        type: 'commission_verified',
        user: doc.userId,
        message: `${user.name} earned $${doc.amount.toFixed(2)} commission`,
        points: Math.floor(doc.amount / 10), // 1 point per $10 earned
        metadata: {
          commissionId: doc._id,
          amount: doc.amount,
          commissionType: doc.commissionType
        }
      });
    }
  }
});

// Update PowerLine statistics when position is created
PowerLinePosition.schema.post('save', async function(doc) {
  if (doc.isNew) {
    // Create PowerLine join activity
    const Activity = require('./Activity');
    const User = require('./User');
    
    const user = await User.findById(doc.userId);
    if (user) {
      await Activity.create({
        type: 'powerline_join',
        user: doc.userId,
        message: `${doc.displayName} secured PowerLine position #${doc.position}`,
        points: 100, // Welcome bonus
        metadata: {
          position: doc.position,
          sponsorId: doc.sponsorId,
          source: doc.source
        }
      });
      
      // Update sponsor's recruitment stats
      if (doc.sponsorId) {
        const sponsor = await User.findById(doc.sponsorId);
        if (sponsor) {
          sponsor.stats = sponsor.stats || {};
          sponsor.stats.powerLineRecruits = (sponsor.stats.powerLineRecruits || 0) + 1;
          sponsor.stats.totalRecruits = (sponsor.stats.totalRecruits || 0) + 1;
          sponsor.stats.points = (sponsor.stats.points || 0) + 200; // Recruitment bonus
          await sponsor.save();
          
          // Create recruitment activity for sponsor
          await Activity.create({
            type: 'powerline_recruit',
            user: doc.sponsorId,
            target: doc.userId,
            message: `${sponsor.name} recruited ${doc.displayName} to PowerLine position #${doc.position}`,
            points: 200,
            metadata: {
              recruitPosition: doc.position,
              recruitName: doc.displayName
            }
          });
        }
      }
    }
  }
});

// Create activity when 3-way call is scheduled
ScheduledCall.schema.post('save', async function(doc) {
  if (doc.isNew) {
    const Activity = require('./Activity');
    const User = require('./User');
    
    const promoter = await User.findById(doc.promoterId);
    if (promoter) {
      await Activity.create({
        type: 'call_scheduled',
        user: doc.promoterId,
        message: `${promoter.name} scheduled 3-way call with ${doc.prospectName}`,
        points: 50,
        metadata: {
          callId: doc._id,
          prospectName: doc.prospectName,
          leaderPreference: doc.leaderPreference,
          preferredDateTime: doc.preferredDateTime
        }
      });
    }
  }
  
  // Create activity when call is completed
  if (this.isModified('status') && doc.status === 'completed') {
    const Activity = require('./Activity');
    const User = require('./User');
    
    const promoter = await User.findById(doc.promoterId);
    if (promoter) {
      let points = 100; // Base completion points
      
      // Bonus points based on call result
      if (doc.callResult === 'enrolled') {
        points = 500; // Big bonus for successful enrollment
      } else if (doc.callResult === 'follow-up') {
        points = 150; // Medium bonus for follow-up opportunity
      }
      
      await Activity.create({
        type: 'call_completed',
        user: doc.promoterId,
        message: `${promoter.name} completed 3-way call with ${doc.prospectName} - ${doc.callResult}`,
        points: points,
        metadata: {
          callId: doc._id,
          prospectName: doc.prospectName,
          callResult: doc.callResult,
          assignedLeader: doc.assignedLeader
        }
      });
      
      // Update promoter stats
      promoter.stats = promoter.stats || {};
      promoter.stats.callsCompleted = (promoter.stats.callsCompleted || 0) + 1;
      if (doc.callResult === 'enrolled') {
        promoter.stats.callsSuccessful = (promoter.stats.callsSuccessful || 0) + 1;
      }
      promoter.stats.points = (promoter.stats.points || 0) + points;
      await promoter.save();
    }
  }
});

// Create activity when user levels up
User.schema.post('save', async function(doc) {
  if (this.isModified('stats.level')) {
    const Activity = require('./Activity');
    
    // Only create activity if level actually increased
    const original = this.getUpdate();
    const originalLevel = original?.['stats.level'];
    if (!originalLevel || doc.stats.level > originalLevel) {
      await Activity.create({
        type: 'level_up',
        user: doc._id,
        team: doc.teams && doc.teams.length > 0 ? doc.teams[0].team : null,
        message: `${doc.name || doc.username} reached level ${doc.stats.level}!`,
        points: 100,
        metadata: {
          levelFrom: originalLevel || doc.stats.level - 1,
          levelTo: doc.stats.level
        }
      });
    }
  }
});

// Helper function to calculate achievement points
function getAchievementPoints(rarity) {
  switch (rarity) {
    case 'common': return 50;
    case 'uncommon': return 100;
    case 'rare': return 250;
    case 'epic': return 500;
    case 'legendary': return 1000;
    default: return 50;
  }
}

// Update team stats when activities are created
Activity.schema.post('save', async function(doc) {
  if (doc.team) {
    const Team = require('./Team');
    const team = await Team.findById(doc.team);
    
    if (team) {
      // Update total points
      team.stats.totalPoints = (team.stats.totalPoints || 0) + (doc.points || 0);
      
      // Update recruitment count
      if (doc.type === 'powerline_recruit' || doc.type === 'recruit') {
        team.stats.totalRecruits = (team.stats.totalRecruits || 0) + 1;
      }
      
      // Update commission tracking
      if (doc.type === 'commission_verified') {
        team.stats.totalCommissions = (team.stats.totalCommissions || 0) + 1;
        team.stats.totalCommissionAmount = (team.stats.totalCommissionAmount || 0) + doc.metadata.amount;
      }
      
      // Update call statistics
      if (doc.type === 'call_completed') {
        team.stats.totalCalls = (team.stats.totalCalls || 0) + 1;
        if (doc.metadata.callResult === 'enrolled') {
          team.stats.successfulCalls = (team.stats.successfulCalls || 0) + 1;
        }
      }
      
      await team.save();
    }
  }
});

// Cleanup expired invites
Team.schema.pre('find', function() {
  this.updateMany(
    {
      'invites.expiresAt': { $lt: new Date() }
    },
    {
      $pull: {
        invites: {
          expiresAt: { $lt: new Date() }
        }
      }
    }
  );
});

// Cleanup old activities (keep last 10000 per team)
Activity.schema.post('save', async function() {
  if (this.team) {
    const teamActivities = await this.constructor.countDocuments({ team: this.team });
    
    if (teamActivities > 10000) {
      const oldActivities = await this.constructor.find({ team: this.team })
        .sort({ createdAt: 1 })
        .limit(teamActivities - 10000)
        .select('_id');
      
      await this.constructor.deleteMany({
        _id: { $in: oldActivities.map(a => a._id) }
      });
    }
  }
});

// PowerLine position validation
PowerLinePosition.schema.pre('save', async function(next) {
  if (this.isNew) {
    // Ensure position number is unique
    const existingPosition = await this.constructor.findOne({ 
      position: this.position,
      _id: { $ne: this._id }
    });
    
    if (existingPosition) {
      const error = new Error('Position number already exists');
      error.code = 'DUPLICATE_POSITION';
      return next(error);
    }
    
    // Ensure user only has one position
    const existingUserPosition = await this.constructor.findOne({ 
      userId: this.userId,
      _id: { $ne: this._id }
    });
    
    if (existingUserPosition) {
      const error = new Error('User already has a PowerLine position');
      error.code = 'DUPLICATE_USER_POSITION';
      return next(error);
    }
  }
  
  next();
});