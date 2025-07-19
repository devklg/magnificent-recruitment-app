const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// CORS and middleware setup
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
  console.log('🎮 Connected to MongoDB - PowerLine ready!');
});

// Import Models
const { User, Team, Activity } = require('./models');
const Commission = require('./models/Commission');
const PowerLinePosition = require('./models/PowerLinePosition');
const ScheduledCall = require('./models/ScheduledCall');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const schedulingRoutes = require('./routes/scheduling');
const commissionRoutes = require('./routes/commissions');
const powerlineRoutes = require('./routes/powerline');
const adminRoutes = require('./routes/admin');

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

// Make authenticateToken available to routes
app.locals.authenticateToken = authenticateToken;

// WebSocket Setup for Real-time Features
require('./websocket/realtime')(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/powerline', powerlineRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    message: '🚀 Magnificent Recruitment API - PowerLine Ready!',
    version: '2.0.0',
    features: [
      '3-way call scheduling',
      'Manual commission tracking',
      'PowerLine queue management',
      'Admin CRUD operations',
      'Real-time updates',
      'Printing capabilities'
    ],
    timestamp: new Date().toISOString()
  });
});

// PowerLine enrollment endpoint (public)
app.post('/api/enroll', async (req, res) => {
  try {
    const { name, email, phone, sponsorCode } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }

    // Check if email already enrolled
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const existingPosition = await PowerLinePosition.findOne({ userId: existingUser._id });
      if (existingPosition) {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already enrolled in PowerLine',
          position: existingPosition.position
        });
      }
    }

    // Find sponsor if code provided
    let sponsor = null;
    if (sponsorCode) {
      sponsor = await User.findOne({ sponsorCode });
    }

    // Create user if doesn't exist
    let user = existingUser;
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      user = new User({
        name,
        email,
        phone: phone || '',
        password: await bcrypt.hash(tempPassword, 12),
        role: 'prospect',
        status: 'pending'
      });
      await user.save();
    }

    // Get next PowerLine position
    const nextPosition = await PowerLinePosition.getNextPosition();

    // Create PowerLine position
    const powerlinePosition = new PowerLinePosition({
      userId: user._id,
      position: nextPosition,
      displayName: name,
      sponsorId: sponsor?._id || null,
      sponsorName: sponsor?.name || null,
      status: 'active',
      source: 'public_enrollment',
      contactInfo: {
        email,
        phone: phone || null
      }
    });

    await powerlinePosition.save();

    // Update user with PowerLine info
    user.powerLinePosition = nextPosition;
    user.powerLineSponsor = sponsor?._id || null;
    user.powerLineJoinDate = new Date();
    await user.save();

    // Create welcome activity
    const activity = new Activity({
      type: 'powerline_join',
      user: user._id,
      message: `${name} secured PowerLine position #${nextPosition}!`,
      points: 0,
      metadata: {
        position: nextPosition,
        sponsor: sponsor?.name || null
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: `Congratulations! Your PowerLine position #${nextPosition} has been secured!`,
      position: {
        number: nextPosition,
        name: name,
        sponsor: sponsor?.name || null,
        joinedAt: powerlinePosition.joinedAt
      },
      nextSteps: [
        sponsor ? `Contact your sponsor ${sponsor.name} to learn more` : 'A sponsor will contact you soon',
        'Watch your position in the PowerLine queue',
        'Share the opportunity with others'
      ]
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Enrollment failed. Please try again.' 
    });
  }
});

// Real-time PowerLine queue status (public)
app.get('/api/queue-status', async (req, res) => {
  try {
    const totalPositions = await PowerLinePosition.countDocuments();
    
    // Get recent additions (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const recentAdditions = await PowerLinePosition.countDocuments({
      joinedAt: { $gte: yesterday }
    });

    // Get sample of recent positions for display
    const recentPositions = await PowerLinePosition.find()
      .sort({ position: -1 })
      .limit(10)
      .select('position displayName joinedAt');

    res.json({
      success: true,
      stats: {
        totalPositions,
        recentAdditions,
        recentPositions: recentPositions.map(pos => ({
          position: pos.position,
          name: pos.displayName,
          timeAgo: getTimeAgo(pos.joinedAt)
        }))
      },
      message: 'Live PowerLine queue status'
    });

  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch queue status' 
    });
  }
});

// Commission feed for social proof (public)
app.get('/api/commission-feed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const recentCommissions = await Commission.find({ 
      verified: true,
      showInFeed: true,
      isPublic: true
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('amount description userName createdAt commissionType');

    const feed = recentCommissions.map(comm => ({
      amount: `$${comm.amount.toFixed(2)}`,
      description: comm.description,
      promoter: comm.userName,
      timeAgo: getTimeAgo(comm.createdAt),
      type: comm.commissionType
    }));

    res.json({
      success: true,
      feed,
      message: 'Live commission activity'
    });

  } catch (error) {
    console.error('Commission feed error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch commission feed' 
    });
  }
});

// Utility function
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\\n🚀 MAGNIFICENT RECRUITMENT API - POWERLINE EDITION`);
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🎯 Features: 3-way calls • Commission tracking • PowerLine queue • Admin CRUD`);
  console.log(`💻 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 WebSocket support enabled for real-time updates\\n`);
});

module.exports = { app, server, io };