const express = require('express');
const { User, Team, Activity } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');
const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('teams.team', 'name avatar stats')
      .populate('friends.user', 'username discriminator avatar status isOnline')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get recent activities
    const recentActivities = await Activity.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('team', 'name avatar');

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        experienceToNext: user.experienceToNext,
        levelProgress: user.levelProgress
      },
      recentActivities
    });
  } catch (error) {
    console.error('🔴 Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Server error',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Update user profile
router.patch('/me', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const allowedUpdates = ['avatar', 'banner', 'customStatus', 'preferences'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Log profile update activity
    const activity = new Activity({
      type: 'profile_updated',
      user: user._id,
      message: `${user.displayName} updated their profile`,
      visibility: 'private',
      metadata: {
        updatedFields: Object.keys(updates),
        updatedAt: new Date()
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: '✨ Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('🔴 Profile update error:', error);
    res.status(500).json({
      error: 'Server error during profile update',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Update user status (online, idle, dnd, invisible)
router.patch('/me/status', authenticateToken, async (req, res) => {
  try {
    const { status, customStatus } = req.body;
    
    const validStatuses = ['online', 'idle', 'dnd', 'invisible', 'offline'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }

    const updates = {};
    if (status) {
      updates.status = status;
      updates.isOnline = status !== 'offline' && status !== 'invisible';
    }
    if (customStatus !== undefined) {
      updates.customStatus = customStatus;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    ).select('username discriminator status customStatus isOnline');

    res.json({
      success: true,
      message: '📡 Status updated',
      user
    });
  } catch (error) {
    console.error('🔴 Status update error:', error);
    res.status(500).json({
      error: 'Server error during status update',
      code: 'STATUS_UPDATE_ERROR'
    });
  }
});

// Get user by ID or username#discriminator
router.get('/:identifier', authenticateToken, async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;

    // Check if identifier is a MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier)
        .select('username discriminator avatar banner role stats status customStatus isOnline lastSeen')
        .populate('teams.team', 'name avatar');
    } else if (identifier.includes('#')) {
      // Parse username#discriminator format
      const [username, discriminator] = identifier.split('#');
      user = await User.findOne({ username, discriminator })
        .select('username discriminator avatar banner role stats status customStatus isOnline lastSeen')
        .populate('teams.team', 'name avatar');
    } else {
      return res.status(400).json({
        error: 'Invalid identifier format. Use user ID or username#discriminator',
        code: 'INVALID_IDENTIFIER'
      });
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check privacy settings
    if (!user.preferences.privacy.showProfile && user._id.toString() !== req.user.userId) {
      return res.status(403).json({
        error: 'User profile is private',
        code: 'PRIVATE_PROFILE'
      });
    }

    // Get public activities if profile is public
    let recentActivities = [];
    if (user.preferences.privacy.showProfile || user._id.toString() === req.user.userId) {
      recentActivities = await Activity.find({ 
        user: user._id,
        visibility: 'public'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('team', 'name avatar');
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        displayName: user.displayName
      },
      recentActivities
    });
  } catch (error) {
    console.error('🔴 User fetch error:', error);
    res.status(500).json({
      error: 'Server error',
      code: 'USER_FETCH_ERROR'
    });
  }
});

// Search users
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'QUERY_TOO_SHORT'
      });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } }
          ]
        },
        { 'preferences.privacy.showProfile': true }
      ]
    })
    .select('username discriminator avatar role stats status isOnline')
    .limit(parseInt(limit))
    .sort({ 'stats.level': -1, 'stats.points': -1 });

    res.json({
      success: true,
      users: users.map(user => ({
        ...user.toObject(),
        displayName: user.displayName
      })),
      count: users.length
    });
  } catch (error) {
    console.error('🔴 User search error:', error);
    res.status(500).json({
      error: 'Server error during search',
      code: 'SEARCH_ERROR'
    });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50, timeframe = 'all' } = req.query;
    
    const validTypes = ['points', 'recruits', 'level', 'experience'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid leaderboard type',
        code: 'INVALID_TYPE'
      });
    }

    let users;
    if (timeframe === 'all') {
      users = await User.getLeaderboard(type, parseInt(limit));
    } else {
      // For timeframe-based leaderboards, we'd need to implement
      // activity-based calculations
      users = await User.getLeaderboard(type, parseInt(limit));
    }

    res.json({
      success: true,
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        ...user.toObject(),
        displayName: `${user.username}#${user.discriminator}`
      })),
      type,
      timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔴 Leaderboard error:', error);
    res.status(500).json({
      error: 'Server error',
      code: 'LEADERBOARD_ERROR'
    });
  }
});

// Send friend request
router.post('/:userId/friend-request', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.userId) {
      return res.status(400).json({
        error: 'Cannot send friend request to yourself',
        code: 'SELF_FRIEND_REQUEST'
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user.userId),
      User.findById(userId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if friend request already exists
    const existingRequest = currentUser.friends.find(
      friend => friend.user.toString() === userId
    );

    if (existingRequest) {
      return res.status(400).json({
        error: 'Friend request already exists',
        code: 'REQUEST_EXISTS'
      });
    }

    // Add friend request
    currentUser.friends.push({
      user: userId,
      status: 'pending',
      requestedAt: new Date()
    });

    targetUser.friends.push({
      user: req.user.userId,
      status: 'pending',
      requestedAt: new Date()
    });

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Create activity
    const activity = new Activity({
      type: 'friend_request_sent',
      user: req.user.userId,
      target: userId,
      targetType: 'User',
      message: `${currentUser.displayName} sent a friend request to ${targetUser.displayName}`,
      visibility: 'private'
    });
    await activity.save();

    res.json({
      success: true,
      message: `👋 Friend request sent to ${targetUser.displayName}`
    });
  } catch (error) {
    console.error('🔴 Friend request error:', error);
    res.status(500).json({
      error: 'Server error',
      code: 'FRIEND_REQUEST_ERROR'
    });
  }
});

// Accept/decline friend request
router.patch('/friends/:userId/:action', authenticateToken, async (req, res) => {
  try {
    const { userId, action } = req.params;
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action. Use accept or decline',
        code: 'INVALID_ACTION'
      });
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(req.user.userId),
      User.findById(userId)
    ]);

    if (!otherUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Find friend requests
    const currentUserFriend = currentUser.friends.find(
      friend => friend.user.toString() === userId && friend.status === 'pending'
    );
    
    const otherUserFriend = otherUser.friends.find(
      friend => friend.user.toString() === req.user.userId && friend.status === 'pending'
    );

    if (!currentUserFriend || !otherUserFriend) {
      return res.status(404).json({
        error: 'Friend request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    if (action === 'accept') {
      currentUserFriend.status = 'accepted';
      currentUserFriend.acceptedAt = new Date();
      otherUserFriend.status = 'accepted';
      otherUserFriend.acceptedAt = new Date();

      // Create activity
      const activity = new Activity({
        type: 'friend_request_accepted',
        user: req.user.userId,
        target: userId,
        targetType: 'User',
        message: `${currentUser.displayName} and ${otherUser.displayName} are now friends`,
        visibility: 'private'
      });
      await activity.save();

      res.json({
        success: true,
        message: `🎉 You are now friends with ${otherUser.displayName}`
      });
    } else {
      // Remove friend requests
      currentUser.friends = currentUser.friends.filter(
        friend => friend.user.toString() !== userId
      );
      otherUser.friends = otherUser.friends.filter(
        friend => friend.user.toString() !== req.user.userId
      );

      res.json({
        success: true,
        message: `❌ Friend request declined`
      });
    }

    await Promise.all([currentUser.save(), otherUser.save()]);
  } catch (error) {
    console.error('🔴 Friend action error:', error);
    res.status(500).json({
      error: 'Server error',
      code: 'FRIEND_ACTION_ERROR'
    });
  }
});

module.exports = router;