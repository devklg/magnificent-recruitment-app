const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Discord-inspired middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/magnificent-recruitment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '🔴 MongoDB connection error:'));
db.once('open', () => {
  console.log('🎮 Connected to MongoDB - Discord style!');
});

// User Schema - Discord inspired
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 32
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['member', 'recruiter', 'admin'],
    default: 'member'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  stats: {
    recruits: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Team Schema - Discord Guild inspired
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  channels: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'voice', 'announcement'],
      default: 'text'
    },
    description: String,
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  stats: {
    totalMembers: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    totalRecruits: { type: Number, default: 0 }
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
      enum: ['none', 'low', 'medium', 'high'],
      default: 'low'
    }
  }
}, {
  timestamps: true
});

// Recruitment Activity Schema
const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['recruit', 'promotion', 'achievement', 'team_join', 'level_up'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  message: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);
const Activity = mongoose.model('Activity', activitySchema);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'magnificent-recruitment-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Discord-style Routes

// Health check - Discord style
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    message: '🎮 Magnificent Recruitment API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// User Registration - Discord style
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'magnificent-recruitment-secret',
      { expiresIn: '7d' }
    );

    // Log activity
    const activity = new Activity({
      type: 'team_join',
      user: user._id,
      message: `${username} joined the Magnificent Recruitment Empire!`,
      points: 100
    });
    await activity.save();

    res.status(201).json({
      message: 'Welcome to the Empire!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User Login - Discord style
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).populate('team');
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'magnificent-recruitment-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Welcome back to the Empire!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats,
        team: user.team
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get User Profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('team')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Team Dashboard
app.get('/api/teams/:teamId/dashboard', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId)
      .populate('members.user', 'username avatar stats isOnline')
      .populate('owner', 'username avatar');
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get recent activities
    const activities = await Activity.find({ team: teamId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      team,
      activities,
      stats: {
        totalMembers: team.members.length,
        onlineMembers: team.members.filter(m => m.user.isOnline).length,
        totalPoints: team.members.reduce((sum, m) => sum + m.user.stats.points, 0)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Recruitment Tracking
app.post('/api/recruitment/track', authenticateToken, async (req, res) => {
  try {
    const { targetEmail, message, type = 'recruit' } = req.body;
    
    const recruiter = await User.findById(req.user.userId);
    
    if (!recruiter) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    // Create activity
    const activity = new Activity({
      type,
      user: recruiter._id,
      team: recruiter.team,
      message: message || `${recruiter.username} initiated recruitment contact`,
      points: 50,
      metadata: {
        targetEmail,
        recruitmentType: type
      }
    });

    await activity.save();

    // Update recruiter stats
    recruiter.stats.points += 50;
    recruiter.stats.recruits += 1;
    
    // Level up check (every 1000 points)
    const newLevel = Math.floor(recruiter.stats.points / 1000) + 1;
    if (newLevel > recruiter.stats.level) {
      recruiter.stats.level = newLevel;
      
      // Level up activity
      const levelUpActivity = new Activity({
        type: 'level_up',
        user: recruiter._id,
        team: recruiter.team,
        message: `${recruiter.username} reached level ${newLevel}!`,
        points: 100
      });
      await levelUpActivity.save();
    }

    await recruiter.save();

    res.json({
      message: 'Recruitment activity tracked!',
      points: 50,
      totalPoints: recruiter.stats.points,
      level: recruiter.stats.level,
      activity: activity
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { type = 'points', limit = 50 } = req.query;
    
    let sortField = 'stats.points';
    if (type === 'recruits') sortField = 'stats.recruits';
    if (type === 'level') sortField = 'stats.level';

    const leaders = await User.find()
      .select('username avatar stats role team')
      .populate('team', 'name avatar')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({
      leaderboard: leaders,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Real-time Activity Feed
app.get('/api/activities/feed', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    
    let query = {};
    if (type) query.type = type;
    
    const activities = await Activity.find(query)
      .populate('user', 'username avatar')
      .populate('target', 'username avatar')
      .populate('team', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ activities });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: '🎮 This endpoint doesn\'t exist in our Discord!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎮 MAGNIFICENT RECRUITMENT API`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💜 Discord + Framer fusion backend`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;