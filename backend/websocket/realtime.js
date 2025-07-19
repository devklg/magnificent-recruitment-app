// ALEX: Real-time WebSocket server for Discord-inspired features

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Team, Activity } = require('../models');

class RealtimeServer {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    this.connectedUsers = new Map();
    this.teamRooms = new Map();
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('⚡ ALEX: Real-time WebSocket server initialized');
  }

  setupMiddleware() {
    // JWT Authentication middleware for WebSocket
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'magnificent-recruitment-secret');
        
        // Get user data
        const user = await User.findById(decoded.userId)
          .populate('teams.team', 'name');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = {
          id: user._id,
          username: user.username,
          discriminator: user.discriminator,
          displayName: user.displayName,
          avatar: user.avatar,
          status: user.status,
          teams: user.teams
        };
        
        next();
      } catch (error) {
        console.error('🔴 WebSocket auth error:', error.message);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`⚡ User ${socket.user.displayName} connected`);
      
      this.handleUserConnection(socket);
      this.handleUserStatus(socket);
      this.handleTeamEvents(socket);
      this.handleRecruitmentEvents(socket);
      this.handleActivityEvents(socket);
      this.handleDisconnection(socket);
    });
  }

  handleUserConnection(socket) {
    // Store connected user
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their team rooms
    socket.user.teams.forEach(teamMembership => {
      const teamId = teamMembership.team._id.toString();
      socket.join(`team:${teamId}`);
      
      // Track team room members
      if (!this.teamRooms.has(teamId)) {
        this.teamRooms.set(teamId, new Set());
      }
      this.teamRooms.get(teamId).add(socket.userId);
    });

    // Update user online status
    this.updateUserOnlineStatus(socket.userId, 'online');

    // Send initial data
    socket.emit('connected', {
      user: socket.user,
      timestamp: new Date(),
      connectedUsers: this.getConnectedUsersCount(),
      message: '🎮 Connected to Magnificent Recruitment real-time server!'
    });

    // Notify friends about online status
    this.notifyFriendsStatusChange(socket.userId, 'online');
  }

  handleUserStatus(socket) {
    // Handle status updates (online, idle, dnd, invisible)
    socket.on('status:update', async (data) => {
      try {
        const { status, customStatus } = data;
        
        // Update in database
        await User.findByIdAndUpdate(socket.userId, {
          status,
          customStatus,
          isOnline: status !== 'offline' && status !== 'invisible'
        });

        // Update socket user data
        socket.user.status = status;
        socket.user.customStatus = customStatus;

        // Notify friends and team members
        this.notifyFriendsStatusChange(socket.userId, status, customStatus);
        this.notifyTeamsStatusChange(socket.userId, status, customStatus);

        socket.emit('status:updated', {
          status,
          customStatus,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('🔴 Status update error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { teamId, channelId } = data;
      socket.to(`team:${teamId}`).emit('typing:start', {
        userId: socket.userId,
        username: socket.user.username,
        channelId,
        timestamp: new Date()
      });
    });

    socket.on('typing:stop', (data) => {
      const { teamId, channelId } = data;
      socket.to(`team:${teamId}`).emit('typing:stop', {
        userId: socket.userId,
        channelId,
        timestamp: new Date()
      });
    });
  }

  handleTeamEvents(socket) {
    // Handle team joining
    socket.on('team:join', async (data) => {
      try {
        const { teamId } = data;
        
        // Verify user is member of this team
        const team = await Team.findById(teamId);
        const isMember = team.members.some(m => m.user.toString() === socket.userId);
        
        if (!isMember) {
          socket.emit('error', { message: 'Not a member of this team' });
          return;
        }

        socket.join(`team:${teamId}`);
        
        // Track team room members
        if (!this.teamRooms.has(teamId)) {
          this.teamRooms.set(teamId, new Set());
        }
        this.teamRooms.get(teamId).add(socket.userId);

        // Notify team members
        socket.to(`team:${teamId}`).emit('team:member_online', {
          user: socket.user,
          timestamp: new Date()
        });

        socket.emit('team:joined', {
          teamId,
          onlineMembers: this.teamRooms.get(teamId).size,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('🔴 Team join error:', error);
        socket.emit('error', { message: 'Failed to join team' });
      }
    });

    // Handle team leaving
    socket.on('team:leave', (data) => {
      const { teamId } = data;
      
      socket.leave(`team:${teamId}`);
      
      if (this.teamRooms.has(teamId)) {
        this.teamRooms.get(teamId).delete(socket.userId);
      }

      // Notify team members
      socket.to(`team:${teamId}`).emit('team:member_offline', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle team member updates
    socket.on('team:member_update', (data) => {
      const { teamId, memberId, updates } = data;
      
      // Broadcast to team members
      this.io.to(`team:${teamId}`).emit('team:member_updated', {
        memberId,
        updates,
        updatedBy: socket.userId,
        timestamp: new Date()
      });
    });
  }

  handleRecruitmentEvents(socket) {
    // Handle recruitment activity tracking
    socket.on('recruitment:track', async (data) => {
      try {
        const { type, targetEmail, message, teamId } = data;
        
        // Create activity
        const activity = new Activity({
          type: 'recruit',
          user: socket.userId,
          team: teamId,
          message: message || `${socket.user.displayName} initiated recruitment contact`,
          points: 50,
          experience: 25,
          visibility: 'team',
          metadata: {
            targetEmail,
            recruitmentType: type,
            realtime: true
          }
        });

        await activity.save();

        // Update user stats
        await User.findByIdAndUpdate(socket.userId, {
          $inc: {
            'stats.recruits': 1,
            'stats.points': 50,
            'stats.experience': 25
          }
        });

        // Broadcast to team
        if (teamId) {
          this.io.to(`team:${teamId}`).emit('recruitment:new_activity', {
            activity: await activity.populate('user', 'username discriminator avatar'),
            timestamp: new Date()
          });
        }

        // Send to user
        socket.emit('recruitment:tracked', {
          points: 50,
          experience: 25,
          activity,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('🔴 Recruitment tracking error:', error);
        socket.emit('error', { message: 'Failed to track recruitment activity' });
      }
    });

    // Handle live recruitment leaderboard updates
    socket.on('recruitment:leaderboard_subscribe', (data) => {
      const { teamId, type } = data;
      socket.join(`leaderboard:${teamId}:${type}`);
    });

    socket.on('recruitment:leaderboard_unsubscribe', (data) => {
      const { teamId, type } = data;
      socket.leave(`leaderboard:${teamId}:${type}`);
    });
  }

  handleActivityEvents(socket) {
    // Handle activity feed subscriptions
    socket.on('activity:subscribe', (data) => {
      const { type, teamId } = data;
      
      if (type === 'global') {
        socket.join('activity:global');
      } else if (type === 'team' && teamId) {
        socket.join(`activity:team:${teamId}`);
      }
    });

    socket.on('activity:unsubscribe', (data) => {
      const { type, teamId } = data;
      
      if (type === 'global') {
        socket.leave('activity:global');
      } else if (type === 'team' && teamId) {
        socket.leave(`activity:team:${teamId}`);
      }
    });

    // Handle activity reactions
    socket.on('activity:react', async (data) => {
      try {
        const { activityId, emoji } = data;
        
        const activity = await Activity.findById(activityId);
        if (!activity) {
          socket.emit('error', { message: 'Activity not found' });
          return;
        }

        await activity.addReaction(emoji, socket.userId);
        
        // Broadcast reaction to relevant rooms
        const rooms = ['activity:global'];
        if (activity.team) {
          rooms.push(`activity:team:${activity.team}`);
        }
        
        rooms.forEach(room => {
          this.io.to(room).emit('activity:reaction_added', {
            activityId,
            emoji,
            userId: socket.userId,
            username: socket.user.username,
            timestamp: new Date()
          });
        });
      } catch (error) {
        console.error('🔴 Activity reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });
  }

  handleDisconnection(socket) {
    socket.on('disconnect', () => {
      console.log(`⚡ User ${socket.user.displayName} disconnected`);
      
      // Remove from connected users
      this.connectedUsers.delete(socket.userId);
      
      // Remove from team rooms
      socket.user.teams.forEach(teamMembership => {
        const teamId = teamMembership.team._id.toString();
        if (this.teamRooms.has(teamId)) {
          this.teamRooms.get(teamId).delete(socket.userId);
        }
        
        // Notify team members
        socket.to(`team:${teamId}`).emit('team:member_offline', {
          userId: socket.userId,
          timestamp: new Date()
        });
      });

      // Update user offline status
      this.updateUserOnlineStatus(socket.userId, 'offline');
      
      // Notify friends about offline status
      this.notifyFriendsStatusChange(socket.userId, 'offline');
    });
  }

  async updateUserOnlineStatus(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, {
        status,
        isOnline: status !== 'offline',
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('🔴 User status update error:', error);
    }
  }

  async notifyFriendsStatusChange(userId, status, customStatus = null) {
    try {
      const user = await User.findById(userId).populate('friends.user');
      const friends = user.friends.filter(f => f.status === 'accepted');
      
      friends.forEach(friend => {
        const friendConnection = this.connectedUsers.get(friend.user._id.toString());
        if (friendConnection) {
          this.io.to(friendConnection.socketId).emit('friend:status_change', {
            userId,
            status,
            customStatus,
            timestamp: new Date()
          });
        }
      });
    } catch (error) {
      console.error('🔴 Friend notification error:', error);
    }
  }

  notifyTeamsStatusChange(userId, status, customStatus = null) {
    const userConnection = this.connectedUsers.get(userId);
    if (!userConnection) return;

    userConnection.user.teams.forEach(teamMembership => {
      const teamId = teamMembership.team._id.toString();
      this.io.to(`team:${teamId}`).emit('team:member_status_change', {
        userId,
        status,
        customStatus,
        timestamp: new Date()
      });
    });
  }

  // Broadcast new activity to relevant rooms
  broadcastActivity(activity) {
    // Global activity feed
    if (activity.visibility === 'public') {
      this.io.to('activity:global').emit('activity:new', {
        activity,
        timestamp: new Date()
      });
    }
    
    // Team activity feed
    if (activity.team && ['public', 'team'].includes(activity.visibility)) {
      this.io.to(`activity:team:${activity.team}`).emit('activity:new', {
        activity,
        timestamp: new Date()
      });
    }
  }

  // Broadcast leaderboard updates
  broadcastLeaderboardUpdate(teamId, type, leaderboard) {
    this.io.to(`leaderboard:${teamId}:${type}`).emit('leaderboard:update', {
      leaderboard,
      type,
      timestamp: new Date()
    });
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getTeamOnlineCount(teamId) {
    return this.teamRooms.get(teamId)?.size || 0;
  }

  // Get all connected users (for admin purposes)
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values()).map(conn => ({
      user: conn.user,
      connectedAt: conn.connectedAt
    }));
  }
}

module.exports = RealtimeServer;