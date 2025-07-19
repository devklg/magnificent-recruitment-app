const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Activity } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const router = express.Router();

// Discord-style user registration
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        code: 'USER_EXISTS'
      });
    }

    // Create user with Discord-style avatar
    const user = new User({
      username,
      email,
      password,
      avatar: {
        url: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
      },
      permissions: ['VIEW_CHANNELS', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'CONNECT', 'SPEAK']
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        discriminator: user.discriminator
      },
      process.env.JWT_SECRET || 'magnificent-recruitment-secret',
      { expiresIn: '7d' }
    );

    // Log welcome activity
    const activity = new Activity({
      type: 'team_join',
      user: user._id,
      message: `${user.displayName} joined the Magnificent Recruitment Empire!`,
      points: 100,
      experience: 50,
      visibility: 'public',
      metadata: {
        welcomeBonus: true,
        registrationSource: 'web'
      }
    });
    await activity.save();

    // Add welcome achievement
    user.unlockAchievement({
      name: 'Welcome to the Empire',
      description: 'Successfully registered for Magnificent Recruitment',
      icon: '🎉',
      rarity: 'common'
    });

    // Add experience and check for level up
    const levelResult = user.addExperience(50);
    await user.save();

    res.status(201).json({
      success: true,
      message: '🎮 Welcome to the Magnificent Recruitment Empire!',
      token,
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats,
        leveledUp: levelResult.leveledUp,
        newLevel: levelResult.newLevel
      }
    });
  } catch (error) {
    console.error('🔴 Registration error:', error);
    res.status(500).json({ 
      error: 'Server error during registration',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Discord-style user login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email })
      .select('+password')
      .populate('teams.team', 'name avatar');
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(400).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update online status
    user.status = 'online';
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        discriminator: user.discriminator
      },
      process.env.JWT_SECRET || 'magnificent-recruitment-secret',
      { expiresIn: '7d' }
    );

    // Log login activity
    const activity = new Activity({
      type: 'user_online',
      user: user._id,
      message: `${user.displayName} came online`,
      visibility: 'private',
      metadata: {
        loginTime: new Date(),
        userAgent: req.headers['user-agent']
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: `🎮 Welcome back, ${user.username}!`,
      token,
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        banner: user.banner,
        role: user.role,
        permissions: user.permissions,
        stats: user.stats,
        status: user.status,
        customStatus: user.customStatus,
        teams: user.teams,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('🔴 Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      code: 'LOGIN_ERROR'
    });
  }
});

// Logout (set offline status)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user) {
      user.status = 'offline';
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();

      // Log logout activity
      const activity = new Activity({
        type: 'user_offline',
        user: user._id,
        message: `${user.displayName} went offline`,
        visibility: 'private',
        metadata: {
          logoutTime: new Date()
        }
      });
      await activity.save();
    }

    res.json({
      success: true,
      message: '👋 Successfully logged out'
    });
  } catch (error) {
    console.error('🔴 Logout error:', error);
    res.status(500).json({ 
      error: 'Server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ 
        error: 'Refresh token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'magnificent-recruitment-secret');
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Create new token
    const newToken = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        discriminator: user.discriminator
      },
      process.env.JWT_SECRET || 'magnificent-recruitment-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('🔴 Token refresh error:', error);
    res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('teams.team', 'name avatar')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        banner: user.banner,
        role: user.role,
        permissions: user.permissions,
        stats: user.stats,
        status: user.status,
        customStatus: user.customStatus,
        teams: user.teams,
        preferences: user.preferences,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error('🔴 Token verification error:', error);
    res.status(500).json({ 
      error: 'Server error during verification',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change activity
    const activity = new Activity({
      type: 'password_changed',
      user: user._id,
      message: `${user.displayName} changed their password`,
      visibility: 'private',
      metadata: {
        changedAt: new Date()
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: '🔒 Password successfully changed'
    });
  } catch (error) {
    console.error('🔴 Password change error:', error);
    res.status(500).json({
      error: 'Server error during password change',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

module.exports = router;