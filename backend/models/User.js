const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Discord-inspired User Model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [32, 'Username cannot exceed 32 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  discriminator: {
    type: String,
    default: () => Math.floor(1000 + Math.random() * 9000).toString()
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    url: {
      type: String,
      default: function() {
        return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
      }
    },
    cloudinaryId: String
  },
  banner: {
    url: String,
    cloudinaryId: String
  },
  role: {
    type: String,
    enum: ['member', 'recruiter', 'moderator', 'admin', 'owner'],
    default: 'member'
  },
  permissions: [{
    type: String,
    enum: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'MANAGE_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'READ_MESSAGE_HISTORY',
      'MENTION_EVERYONE',
      'USE_EXTERNAL_EMOJIS',
      'VIEW_GUILD_INSIGHTS',
      'CONNECT',
      'SPEAK',
      'MUTE_MEMBERS',
      'DEAFEN_MEMBERS',
      'MOVE_MEMBERS',
      'USE_VOICE_ACTIVATION',
      'PRIORITY_SPEAKER',
      'CREATE_INSTANT_INVITE',
      'KICK_MEMBERS',
      'BAN_MEMBERS',
      'ADMINISTRATOR',
      'MANAGE_CHANNELS',
      'MANAGE_GUILD',
      'ADD_REACTIONS',
      'VIEW_AUDIT_LOG',
      'USE_SLASH_COMMANDS',
      'MANAGE_THREADS',
      'USE_PUBLIC_THREADS',
      'USE_PRIVATE_THREADS'
    ]
  }],
  teams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    nickname: String
  }],
  stats: {
    recruits: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    achievements: [{
      name: String,
      description: String,
      icon: String,
      unlockedAt: Date,
      rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
      }
    }]
  },
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      recruitment: {
        type: Boolean,
        default: true
      },
      teamUpdates: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showOnlineStatus: {
        type: Boolean,
        default: true
      },
      showProfile: {
        type: Boolean,
        default: true
      },
      allowDirectMessages: {
        type: Boolean,
        default: true
      }
    }
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'invisible', 'offline'],
    default: 'offline'
  },
  customStatus: {
    text: String,
    emoji: String,
    expiresAt: Date
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String]
  },
  connections: [{
    platform: {
      type: String,
      enum: ['discord', 'linkedin', 'twitter', 'github', 'facebook']
    },
    platformId: String,
    username: String,
    verified: {
      type: Boolean,
      default: false
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full display name
userSchema.virtual('displayName').get(function() {
  return `${this.username}#${this.discriminator}`;
});

// Virtual for experience to next level
userSchema.virtual('experienceToNext').get(function() {
  const nextLevelExp = this.stats.level * 1000;
  return nextLevelExp - this.stats.experience;
});

// Virtual for level progress percentage
userSchema.virtual('levelProgress').get(function() {
  const currentLevelExp = (this.stats.level - 1) * 1000;
  const nextLevelExp = this.stats.level * 1000;
  const progress = ((this.stats.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
  return Math.min(Math.max(progress, 0), 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add experience and handle level ups
userSchema.methods.addExperience = function(amount) {
  this.stats.experience += amount;
  
  // Check for level up
  const newLevel = Math.floor(this.stats.experience / 1000) + 1;
  if (newLevel > this.stats.level) {
    this.stats.level = newLevel;
    return { leveledUp: true, newLevel };
  }
  
  return { leveledUp: false };
};

// Method to unlock achievement
userSchema.methods.unlockAchievement = function(achievementData) {
  const existingAchievement = this.stats.achievements.find(
    ach => ach.name === achievementData.name
  );
  
  if (!existingAchievement) {
    this.stats.achievements.push({
      ...achievementData,
      unlockedAt: new Date()
    });
    return true;
  }
  
  return false;
};

// Method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'admin' || this.role === 'owner';
};

// Method to get user's role in specific team
userSchema.methods.getRoleInTeam = function(teamId) {
  const teamMembership = this.teams.find(t => t.team.toString() === teamId.toString());
  return teamMembership ? teamMembership.role : null;
};

// Static method to find online users
userSchema.statics.findOnlineUsers = function() {
  return this.find({ isOnline: true, status: { $ne: 'invisible' } });
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(type = 'points', limit = 50) {
  const sortField = `stats.${type}`;
  return this.find()
    .select('username discriminator avatar stats role')
    .sort({ [sortField]: -1 })
    .limit(limit);
};

module.exports = mongoose.model('User', userSchema);