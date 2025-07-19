// MARCUS/JAMES: Model exports for Discord-inspired recruitment platform

const User = require('./User');
const Team = require('./Team');
const Activity = require('./Activity');

module.exports = {
  User,
  Team,
  Activity
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

// Create activity when user levels up
User.schema.post('save', async function(doc) {
  if (this.isModified('stats.level')) {
    const Activity = require('./Activity');
    
    // Only create activity if level actually increased
    const originalLevel = this.getUpdate()?.['stats.level'];
    if (!originalLevel || doc.stats.level > originalLevel) {
      await Activity.create({
        type: 'level_up',
        user: doc._id,
        team: doc.teams.length > 0 ? doc.teams[0].team : null,
        message: `${doc.username} reached level ${doc.stats.level}!`,
        points: 100,
        experience: 50,
        metadata: {
          levelFrom: originalLevel || doc.stats.level - 1,
          levelTo: doc.stats.level
        }
      });
    }
  }
});

// Create activity when user achieves something
User.schema.post('save', async function(doc) {
  if (this.isModified('stats.achievements')) {
    const Activity = require('./Activity');
    
    // Find new achievements
    const original = this.getUpdate()?.['stats.achievements'] || [];
    const newAchievements = doc.stats.achievements.filter(achievement => 
      !original.some(orig => orig.name === achievement.name)
    );
    
    // Create activity for each new achievement
    for (const achievement of newAchievements) {
      await Activity.create({
        type: 'achievement',
        user: doc._id,
        team: doc.teams.length > 0 ? doc.teams[0].team : null,
        message: `${doc.username} unlocked "${achievement.name}"!`,
        points: getAchievementPoints(achievement.rarity),
        metadata: {
          achievementName: achievement.name,
          achievementRarity: achievement.rarity
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
      team.stats.totalPoints += doc.points || 0;
      
      // Update recruitment count
      if (doc.type === 'recruit') {
        team.stats.totalRecruits += 1;
      }
      
      // Update message count
      if (doc.type === 'message_sent') {
        team.stats.messagesCount += 1;
      }
      
      // Calculate average level
      const User = require('./User');
      const members = await User.find({
        'teams.team': team._id
      }).select('stats.level');
      
      if (members.length > 0) {
        const totalLevels = members.reduce((sum, member) => sum + member.stats.level, 0);
        team.stats.averageLevel = Math.round(totalLevels / members.length * 100) / 100;
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
});