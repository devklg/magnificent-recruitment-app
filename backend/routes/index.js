// MARCUS/JAMES: Main router exports for Discord-inspired recruitment platform

const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const teamRoutes = require('./teams');
const activityRoutes = require('./activities');
const recruitmentRoutes = require('./recruitment');

const router = express.Router();

// API Health check - Discord style
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    message: '🎮 Magnificent Recruitment API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    discord_style: true,
    framer_motion: true,
    features: [
      'Authentication (Discord-style)',
      'Team Management (Guild-inspired)',
      'Activity Feed (Real-time)',
      'Recruitment Tracking',
      'Leaderboards & Stats',
      'Friend System',
      'Achievement System',
      'Invite System'
    ]
  });
});

// API Info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Magnificent Recruitment API',
    description: 'Discord + Framer inspired recruitment platform backend',
    version: '1.0.0',
    author: 'Kevin Gardner',
    architecture: 'BMAD v4 Agent Trinity',
    agents: {
      alexa: 'Frontend Development (Discord + Framer UI)',
      marcus_james: 'Backend API (Express + MongoDB)',
      alex: 'Real-time Features (WebSocket)',
      quinn: 'Quality Assurance (Testing)',
      aci_dev: 'DevOps (Deployment & CI/CD)'
    },
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /register - User registration',
          'POST /login - User login', 
          'POST /logout - User logout',
          'POST /refresh - Refresh JWT token',
          'GET /verify - Verify JWT token',
          'POST /change-password - Change user password'
        ]
      },
      users: {
        base: '/api/users',
        routes: [
          'GET /me - Get current user profile',
          'PATCH /me - Update user profile',
          'PATCH /me/status - Update user status',
          'GET /:identifier - Get user by ID or username#discriminator',
          'GET /search/:query - Search users',
          'GET /leaderboard/:type - Get leaderboard',
          'POST /:userId/friend-request - Send friend request',
          'PATCH /friends/:userId/:action - Accept/decline friend request'
        ]
      },
      teams: {
        base: '/api/teams',
        routes: [
          'POST / - Create new team',
          'GET / - Get public teams (discovery)',
          'GET /:teamId - Get team by ID',
          'PATCH /:teamId - Update team',
          'POST /:teamId/join/:inviteCode - Join team via invite',
          'POST /:teamId/leave - Leave team'
        ]
      },
      activities: {
        base: '/api/activities',
        routes: [
          'GET /feed - Get activity feed',
          'GET /user/:userId - Get user activities',
          'GET /team/:teamId - Get team activities',
          'POST /react/:activityId - React to activity'
        ]
      },
      recruitment: {
        base: '/api/recruitment',
        routes: [
          'POST /track - Track recruitment activity',
          'GET /stats - Get recruitment statistics',
          'GET /leaderboard - Get recruitment leaderboard',
          'POST /contact - Send recruitment contact'
        ]
      }
    },
    database: {
      type: 'MongoDB',
      models: ['User', 'Team', 'Activity'],
      features: [
        'Discord-inspired user system',
        'Guild-style team management',
        'Real-time activity tracking',
        'Achievement system',
        'Friend system',
        'Invitation system',
        'Role-based permissions'
      ]
    },
    styling: {
      frontend: 'Discord + Framer Motion',
      colors: {
        primary: '#5865F2',
        secondary: '#7289DA',
        background: '#1e1f22',
        cards: '#2b2d31'
      },
      features: [
        'Floating animations',
        'Glass morphism effects', 
        'Hover interactions',
        'Scroll-triggered animations',
        'Purple gradient branding',
        'Gaming-inspired aesthetics'
      ]
    }
  });
});

// Route mounting
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/activities', activityRoutes);
router.use('/recruitment', recruitmentRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: '🎮 This endpoint doesn\'t exist in our Discord!',
    availableEndpoints: [
      '/api/health - API health check',
      '/api/info - API information',
      '/api/auth/* - Authentication routes',
      '/api/users/* - User management routes',
      '/api/teams/* - Team management routes', 
      '/api/activities/* - Activity feed routes',
      '/api/recruitment/* - Recruitment tracking routes'
    ],
    documentation: 'Check /api/info for complete endpoint list'
  });
});

module.exports = router;