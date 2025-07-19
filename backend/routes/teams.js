const express = require('express');
const { Team, User, Activity } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateTeamCreation, validateTeamUpdate } = require('../middleware/validation');
const router = express.Router();

// Create new team (Discord Guild-style)
router.post('/', authenticateToken, validateTeamCreation, async (req, res) => {
  try {
    const { name, description, isPublic = true } = req.body;
    
    // Check if user already owns a team (optional limitation)
    const existingOwnedTeam = await Team.findOne({ owner: req.user.userId });
    if (existingOwnedTeam) {
      return res.status(400).json({
        error: 'You can only own one team at a time',
        code: 'TEAM_LIMIT_REACHED'
      });
    }

    // Create team with Discord-style default channels
    const team = new Team({
      name,
      description,
      owner: req.user.userId,
      members: [{
        user: req.user.userId,
        role: 'admin',
        joinedAt: new Date()
      }],
      channels: [
        {
          name: 'general',
          type: 'text',
          description: 'General recruitment discussion',
          position: 0
        },
        {
          name: 'announcements',
          type: 'announcement',
          description: 'Important team announcements',
          position: 1
        },
        {
          name: 'recruitment',
          type: 'text',
          description: 'Share recruitment strategies and tips',
          position: 2
        },
        {
          name: 'leaderboard',
          type: 'text',
          description: 'Track team performance and rankings',
          position: 3
        }
      ],
      roles: [
        {
          name: 'Admin',
          color: '#5865F2',
          position: 3,
          permissions: ['ADMINISTRATOR'],
          hoist: true
        },
        {
          name: 'Moderator',
          color: '#57F287',
          position: 2,
          permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS', 'MANAGE_CHANNELS'],
          hoist: true
        },
        {
          name: 'Senior Recruiter',
          color: '#FEE75C',
          position: 1,
          permissions: ['VIEW_CHANNELS', 'SEND_MESSAGES', 'CREATE_INSTANT_INVITE'],
          hoist: true
        },
        {
          name: 'Member',
          color: '#99AAB5',
          position: 0,
          permissions: ['VIEW_CHANNELS', 'SEND_MESSAGES'],
          hoist: false
        }
      ],
      settings: {
        isPublic,
        allowInvites: true,
        verificationLevel: 'low',
        defaultNotifications: 'only_mentions'
      },
      stats: {
        totalMembers: 1,
        activeMembers: 1,
        onlineMembers: 1
      }
    });

    await team.save();

    // Update user's teams
    await User.findByIdAndUpdate(req.user.userId, {
      $push: {
        teams: {
          team: team._id,
          role: 'owner',
          joinedAt: new Date()
        }
      }
    });

    // Create team creation activity
    const activity = new Activity({
      type: 'team_created',
      user: req.user.userId,
      team: team._id,
      message: `Created team "${name}"`,
      points: 500,
      experience: 200,
      visibility: 'public',
      metadata: {
        teamName: name,
        isPublic
      }
    });
    await activity.save();

    // Populate team data for response
    const populatedTeam = await Team.findById(team._id)
      .populate('owner', 'username discriminator avatar')
      .populate('members.user', 'username discriminator avatar stats');

    res.status(201).json({
      success: true,
      message: `🏰 Team "${name}" created successfully!`,
      team: populatedTeam
    });
  } catch (error) {
    console.error('🔴 Team creation error:', error);
    res.status(500).json({
      error: 'Server error during team creation',
      code: 'TEAM_CREATION_ERROR'
    });
  }
});

// Get team by ID
router.get('/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId)
      .populate('owner', 'username discriminator avatar stats')
      .populate('members.user', 'username discriminator avatar stats status isOnline')
      .populate('channels');
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
        code: 'TEAM_NOT_FOUND'
      });
    }

    // Check if user is member or team is public
    const isMember = team.members.some(
      member => member.user._id.toString() === req.user.userId
    );
    
    if (!team.settings.isPublic && !isMember) {
      return res.status(403).json({
        error: 'Access denied to private team',
        code: 'PRIVATE_TEAM_ACCESS_DENIED'
      });
    }

    // Get recent team activities
    const activities = await Activity.find({ 
      team: teamId,
      visibility: { $in: isMember ? ['public', 'team'] : ['public'] }
    })
    .populate('user', 'username discriminator avatar')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      team: {
        ...team.toObject(),
        memberCount: team.memberCount,
        onlineMemberCount: team.onlineMemberCount,
        level: team.level
      },
      activities,
      userRole: isMember ? team.members.find(m => m.user._id.toString() === req.user.userId).role : null
    });
  } catch (error) {
    console.error('🔴 Team fetch error:', error);
    res.status(500).json({
      error: 'Server error',
      code: 'TEAM_FETCH_ERROR'
    });
  }
});

// Update team
router.patch('/:teamId', authenticateToken, validateTeamUpdate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
        code: 'TEAM_NOT_FOUND'
      });
    }

    // Check permissions
    const member = team.members.find(
      m => m.user.toString() === req.user.userId
    );
    
    if (!member || !['admin', 'owner'].includes(member.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['name', 'description', 'avatar', 'banner', 'settings'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).populate('owner', 'username discriminator avatar');

    // Log team update activity
    const activity = new Activity({
      type: 'team_updated',
      user: req.user.userId,
      team: teamId,
      message: `Updated team settings`,
      visibility: 'team',
      metadata: {
        updatedFields: Object.keys(filteredUpdates)
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: '✨ Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('🔴 Team update error:', error);
    res.status(500).json({
      error: 'Server error during team update',
      code: 'TEAM_UPDATE_ERROR'
    });
  }
});

// Join team via invite
router.post('/:teamId/join/:inviteCode', authenticateToken, async (req, res) => {
  try {
    const { teamId, inviteCode } = req.params;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
        code: 'TEAM_NOT_FOUND'
      });
    }

    // Check if user is already a member
    const existingMember = team.members.find(
      member => member.user.toString() === req.user.userId
    );
    
    if (existingMember) {
      return res.status(400).json({
        error: 'You are already a member of this team',
        code: 'ALREADY_MEMBER'
      });
    }

    // Use invite
    const invite = await team.useInvite(inviteCode);
    
    // Add user to team
    await team.addMember(req.user.userId, 'member');
    
    // Update user's teams
    await User.findByIdAndUpdate(req.user.userId, {
      $push: {
        teams: {
          team: teamId,
          role: 'member',
          joinedAt: new Date()
        }
      }
    });

    // Create join activity
    const user = await User.findById(req.user.userId);
    const activity = new Activity({
      type: 'team_join',
      user: req.user.userId,
      team: teamId,
      message: `${user.displayName} joined the team`,
      points: 100,
      experience: 50,
      visibility: 'public',
      metadata: {
        inviteCode,
        inviteCreator: invite.creator
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: `🎉 Welcome to ${team.name}!`,
      team: {
        id: team._id,
        name: team.name,
        avatar: team.avatar,
        memberCount: team.memberCount + 1
      }
    });
  } catch (error) {
    console.error('🔴 Team join error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(400).json({
        error: 'Invite has expired',
        code: 'INVITE_EXPIRED'
      });
    }
    
    if (error.message.includes('maximum uses')) {
      return res.status(400).json({
        error: 'Invite has reached maximum uses',
        code: 'INVITE_MAX_USES'
      });
    }
    
    if (error.message.includes('Invalid invite')) {
      return res.status(400).json({
        error: 'Invalid invite code',
        code: 'INVALID_INVITE'
      });
    }
    
    res.status(500).json({
      error: 'Server error during team join',
      code: 'TEAM_JOIN_ERROR'
    });
  }
});

// Leave team
router.post('/:teamId/leave', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
        code: 'TEAM_NOT_FOUND'
      });
    }

    // Check if user is a member
    const member = team.members.find(
      m => m.user.toString() === req.user.userId
    );
    
    if (!member) {
      return res.status(400).json({
        error: 'You are not a member of this team',
        code: 'NOT_MEMBER'
      });
    }

    // Prevent owner from leaving (they must transfer ownership first)
    if (team.owner.toString() === req.user.userId) {
      return res.status(400).json({
        error: 'Team owners cannot leave. Transfer ownership first.',
        code: 'OWNER_CANNOT_LEAVE'
      });
    }

    // Remove user from team
    await team.removeMember(req.user.userId);
    
    // Update user's teams
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: {
        teams: { team: teamId }
      }
    });

    // Create leave activity
    const user = await User.findById(req.user.userId);
    const activity = new Activity({
      type: 'team_leave',
      user: req.user.userId,
      team: teamId,
      message: `${user.displayName} left the team`,
      visibility: 'team'
    });
    await activity.save();

    res.json({
      success: true,
      message: `👋 You have left ${team.name}`
    });
  } catch (error) {
    console.error('🔴 Team leave error:', error);
    res.status(500).json({
      error: 'Server error during team leave',
      code: 'TEAM_LEAVE_ERROR'
    });
  }
});

// Get public teams (discovery)
router.get('/', async (req, res) => {
  try {
    const { search, limit = 20, sort = 'members' } = req.query;
    
    let query = { 'settings.isPublic': true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = {};
    switch (sort) {
      case 'members':
        sortOption = { 'stats.totalMembers': -1 };
        break;
      case 'points':
        sortOption = { 'stats.totalPoints': -1 };
        break;
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { 'stats.totalMembers': -1 };
    }
    
    const teams = await Team.find(query)
      .populate('owner', 'username discriminator avatar')
      .sort(sortOption)
      .limit(parseInt(limit))
      .select('name description avatar stats settings createdAt');
    
    res.json({
      success: true,
      teams: teams.map(team => ({
        ...team.toObject(),
        memberCount: team.memberCount,
        level: team.level
      })),
      count: teams.length
    });
  } catch (error) {
    console.error('🔴 Teams discovery error:', error);
    res.status(500).json({
      error: 'Server error',
      code: 'TEAMS_DISCOVERY_ERROR'
    });
  }
});

module.exports = router;