const mongoose = require('mongoose');

// Discord Guild-inspired Team Model
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    minlength: [2, 'Team name must be at least 2 characters'],
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  avatar: {
    url: String,
    cloudinaryId: String
  },
  banner: {
    url: String,
    cloudinaryId: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    nickname: String,
    joinedAt: {
      type: Date,
      default: Date.now
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
        'CONNECT',
        'SPEAK',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
        'CREATE_INSTANT_INVITE',
        'KICK_MEMBERS',
        'BAN_MEMBERS',
        'MANAGE_CHANNELS',
        'ADD_REACTIONS',
        'USE_SLASH_COMMANDS'
      ]
    }],
    stats: {
      messagesRecruited: { type: Number, default: 0 },
      pointsEarned: { type: Number, default: 0 },
      achievementsUnlocked: { type: Number, default: 0 }
    }
  }],
  channels: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'voice', 'announcement', 'rules', 'general'],
      default: 'text'
    },
    description: String,
    position: {
      type: Number,
      default: 0
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    permissions: [{
      role: {
        type: String,
        enum: ['member', 'moderator', 'admin', 'everyone']
      },
      allow: [String],
      deny: [String]
    }],
    slowmode: {
      type: Number,
      default: 0,
      min: 0,
      max: 21600 // 6 hours in seconds
    },
    topic: String,
    nsfw: {
      type: Boolean,
      default: false
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  roles: [{
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#99AAB5'
    },
    position: {
      type: Number,
      default: 0
    },
    permissions: [String],
    mentionable: {
      type: Boolean,
      default: true
    },
    hoist: {
      type: Boolean,
      default: false
    },
    managed: {
      type: Boolean,
      default: false
    }
  }],
  emojis: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    animated: {
      type: Boolean,
      default: false
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    onlineMembers: {
      type: Number,
      default: 0
    },
    totalRecruits: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    messagesCount: {
      type: Number,
      default: 0
    },
    averageLevel: {
      type: Number,
      default: 1
    }
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'highest'],
      default: 'low'
    },
    explicitContentFilter: {
      type: String,
      enum: ['disabled', 'members_without_roles', 'all_members'],
      default: 'members_without_roles'
    },
    defaultNotifications: {
      type: String,
      enum: ['all_messages', 'only_mentions'],
      default: 'only_mentions'
    },
    locale: {
      type: String,
      default: 'en-US'
    },
    afkTimeout: {
      type: Number,
      default: 300 // 5 minutes
    },
    afkChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    systemChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    rulesChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    publicUpdatesChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    }
  },
  features: [{
    type: String,
    enum: [
      'COMMUNITY',
      'NEWS',
      'PARTNERED',
      'VERIFIED',
      'DISCOVERY',
      'FEATURABLE',
      'ANIMATED_ICON',
      'BANNER',
      'COMMERCE',
      'PUBLIC',
      'PRIVATE_THREADS',
      'THREE_DAY_THREAD_ARCHIVE',
      'SEVEN_DAY_THREAD_ARCHIVE',
      'VANITY_URL',
      'VIP_REGIONS'
    ]
  }],
  vanityUrl: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[a-zA-Z0-9-_]+$/, 'Vanity URL can only contain letters, numbers, hyphens, and underscores']
  },
  invites: [{
    code: {
      type: String,
      unique: true,
      required: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    uses: {
      type: Number,
      default: 0
    },
    maxUses: {
      type: Number,
      default: 0 // 0 = unlimited
    },
    maxAge: {
      type: Number,
      default: 86400 // 24 hours in seconds
    },
    temporary: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  bans: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    executor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    bannedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  auditLog: [{
    action: {
      type: String,
      required: true
    },
    executor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'auditLog.targetType'
    },
    targetType: {
      type: String,
      enum: ['User', 'Channel', 'Role', 'Message']
    },
    changes: [{
      key: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for online member count
teamSchema.virtual('onlineMemberCount').get(function() {
  return this.members.filter(member => 
    member.user && member.user.isOnline
  ).length;
});

// Virtual for team level (based on total points)
teamSchema.virtual('level').get(function() {
  return Math.floor(this.stats.totalPoints / 10000) + 1;
});

// Method to add member
teamSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(
    member => member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  this.stats.totalMembers = this.members.length;
  return this.save();
};

// Method to remove member
teamSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(
    member => member.user.toString() !== userId.toString()
  );
  
  this.stats.totalMembers = this.members.length;
  return this.save();
};

// Method to update member role
teamSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(
    member => member.user.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this team');
  }
  
  member.role = newRole;
  return this.save();
};

// Method to create invite
teamSchema.methods.createInvite = function(creatorId, channelId, options = {}) {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const invite = {
    code: inviteCode,
    creator: creatorId,
    channel: channelId,
    maxUses: options.maxUses || 0,
    maxAge: options.maxAge || 86400,
    temporary: options.temporary || false,
    createdAt: new Date()
  };
  
  if (invite.maxAge > 0) {
    invite.expiresAt = new Date(Date.now() + (invite.maxAge * 1000));
  }
  
  this.invites.push(invite);
  return this.save().then(() => invite);
};

// Method to use invite
teamSchema.methods.useInvite = function(inviteCode) {
  const invite = this.invites.find(inv => inv.code === inviteCode);
  
  if (!invite) {
    throw new Error('Invalid invite code');
  }
  
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new Error('Invite has expired');
  }
  
  if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
    throw new Error('Invite has reached maximum uses');
  }
  
  invite.uses += 1;
  return this.save().then(() => invite);
};

// Method to add audit log entry
teamSchema.methods.addAuditLog = function(action, executor, target, targetType, changes, reason) {
  this.auditLog.push({
    action,
    executor,
    target,
    targetType,
    changes,
    reason,
    timestamp: new Date()
  });
  
  // Keep only last 1000 entries
  if (this.auditLog.length > 1000) {
    this.auditLog = this.auditLog.slice(-1000);
  }
  
  return this.save();
};

// Static method to find public teams
teamSchema.statics.findPublicTeams = function(limit = 50) {
  return this.find({ 'settings.isPublic': true })
    .populate('owner', 'username avatar')
    .sort({ 'stats.totalMembers': -1 })
    .limit(limit);
};

// Static method to search teams
teamSchema.statics.searchTeams = function(query, limit = 20) {
  return this.find({
    $and: [
      { 'settings.isPublic': true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .populate('owner', 'username avatar')
  .limit(limit);
};

module.exports = mongoose.model('Team', teamSchema);