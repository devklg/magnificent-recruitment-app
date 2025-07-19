const express = require('express');
const router = express.Router();
const { User, Team } = require('../models');
const Commission = require('../models/Commission');
const PowerLinePosition = require('../models/PowerLinePosition');
const ScheduledCall = require('../models/ScheduledCall');
const { authenticateToken } = require('../middleware/auth');

// Admin CRUD Operations + Printing System
// Full Create, Read, Update, Delete capabilities for Kevin's admin needs

// Middleware to verify admin access
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

// USER MANAGEMENT CRUD

// GET all users with filtering and pagination
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build search query
    let searchQuery = {};
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) searchQuery.role = role;
    if (status) searchQuery.status = status;

    // Execute query with pagination
    const users = await User.find(searchQuery)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .lean();

    const totalUsers = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        powerLinePosition: user.powerLinePosition,
        totalCommissions: user.totalCommissions || 0,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create new user
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role = 'user', password = 'temppass123' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      role,
      password, // Will be hashed by pre-save middleware
      status: 'active',
      createdBy: req.user.id
    });

    await newUser.save();

    res.json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// PUT update user
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role, status, powerLinePosition } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (powerLinePosition) user.powerLinePosition = powerLinePosition;

    user.updatedBy = req.user.id;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        powerLinePosition: user.powerLinePosition
      },
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// DELETE user (soft delete)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Soft delete - change status instead of removing
    user.status = 'deleted';
    user.deletedBy = req.user.id;
    user.deletedAt = new Date();
    
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully',
      userId: user._id
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// POWERLINE POSITION MANAGEMENT

// GET all positions with filtering
router.get('/positions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status = '',
      startPosition = '',
      endPosition = '' 
    } = req.query;

    let query = {};
    if (status) query.status = status;
    if (startPosition && endPosition) {
      query.position = { 
        $gte: parseInt(startPosition), 
        $lte: parseInt(endPosition) 
      };
    }

    const positions = await PowerLinePosition.find(query)
      .populate('userId', 'name email phone')
      .populate('sponsorId', 'name email')
      .sort({ position: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPositions = await PowerLinePosition.countDocuments(query);

    res.json({
      success: true,
      positions: positions.map(pos => ({
        id: pos._id,
        position: pos.position,
        displayName: pos.displayName,
        user: pos.userId ? {
          name: pos.userId.name,
          email: pos.userId.email,
          phone: pos.userId.phone
        } : null,
        sponsor: pos.sponsorId ? {
          name: pos.sponsorId.name,
          email: pos.sponsorId.email
        } : null,
        status: pos.status,
        joinedAt: pos.joinedAt,
        timeInQueue: pos.timeInQueue
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPositions / limit),
        totalPositions
      }
    });

  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PRINTING SYSTEM

// GET printable user list
router.get('/print/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { format = 'html', role = '', status = '' } = req.query;

    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('name email phone role status powerLinePosition totalCommissions createdAt')
      .sort({ name: 1 })
      .lean();

    if (format === 'csv') {
      // Generate CSV format
      const csvHeader = 'Name,Email,Phone,Role,Status,PowerLine Position,Total Commissions,Joined Date\n';
      const csvData = users.map(user => 
        `"${user.name}","${user.email}","${user.phone || ''}","${user.role}","${user.status}","${user.powerLinePosition || ''}","${user.totalCommissions || 0}","${user.createdAt?.toLocaleDateString() || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      res.send(csvHeader + csvData);
      
    } else {
      // Generate HTML format for printing
      const html = generateUserListHTML(users);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }

  } catch (error) {
    console.error('Error generating user list:', error);
    res.status(500).json({ success: false, message: 'Print generation failed' });
  }
});

// GET printable individual user profile
router.get('/print/user/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user's PowerLine position
    const position = await PowerLinePosition.findOne({ userId: user._id });
    
    // Get user's commissions
    const commissions = await Commission.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's scheduled calls
    const calls = await ScheduledCall.find({ promoterId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const html = generateUserProfileHTML(user, position, commissions, calls);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error generating user profile:', error);
    res.status(500).json({ success: false, message: 'Print generation failed' });
  }
});

// DASHBOARD ANALYTICS

// GET admin dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeframe = 7 } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Gather statistics from all models
    const [userStats, positionStats, commissionStats, callStats] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            new: [
              { $match: { createdAt: { $gte: startDate } } },
              { $count: "count" }
            ],
            byRole: [
              { $group: { _id: "$role", count: { $sum: 1 } } }
            ],
            byStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } }
            ]
          }
        }
      ]),
      
      // PowerLine position statistics
      PowerLinePosition.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            new: [
              { $match: { joinedAt: { $gte: startDate } } },
              { $count: "count" }
            ]
          }
        }
      ]),
      
      // Commission statistics
      Commission.aggregate([
        {
          $match: { verified: true }
        },
        {
          $facet: {
            total: [
              { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
            ],
            recent: [
              { $match: { createdAt: { $gte: startDate } } },
              { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
            ]
          }
        }
      ]),
      
      // Scheduled calls statistics
      ScheduledCall.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            pending: [
              { $match: { status: "pending" } },
              { $count: "count" }
            ],
            completed: [
              { $match: { status: "completed" } },
              { $count: "count" }
            ]
          }
        }
      ])
    ]);

    res.json({
      success: true,
      timeframe: `${timeframe} days`,
      stats: {
        users: {
          total: userStats[0].total[0]?.count || 0,
          new: userStats[0].new[0]?.count || 0,
          byRole: userStats[0].byRole,
          byStatus: userStats[0].byStatus
        },
        positions: {
          total: positionStats[0].total[0]?.count || 0,
          new: positionStats[0].new[0]?.count || 0
        },
        commissions: {
          totalAmount: commissionStats[0].total[0]?.total || 0,
          totalCount: commissionStats[0].total[0]?.count || 0,
          recentAmount: commissionStats[0].recent[0]?.total || 0,
          recentCount: commissionStats[0].recent[0]?.count || 0
        },
        calls: {
          total: callStats[0].total[0]?.count || 0,
          pending: callStats[0].pending[0]?.count || 0,
          completed: callStats[0].completed[0]?.count || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions for HTML generation
function generateUserListHTML(users) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>User List - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    h1 { color: #333; }
    .print-date { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>User Directory</h1>
  <p class="print-date">Generated: ${new Date().toLocaleString()}</p>
  <p>Total Users: ${users.length}</p>
  
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Role</th>
        <th>Status</th>
        <th>PowerLine Position</th>
        <th>Total Commissions</th>
        <th>Join Date</th>
      </tr>
    </thead>
    <tbody>
      ${users.map(user => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.phone || ''}</td>
          <td>${user.role}</td>
          <td>${user.status}</td>
          <td>${user.powerLinePosition || 'Not assigned'}</td>
          <td>$${(user.totalCommissions || 0).toFixed(2)}</td>
          <td>${user.createdAt?.toLocaleDateString() || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
}

function generateUserProfileHTML(user, position, commissions, calls) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>User Profile - ${user.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .profile-section { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; }
    .profile-header { background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background-color: #f2f2f2; }
    h1, h2 { color: #333; }
    .print-date { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="profile-header">
    <h1>User Profile: ${user.name}</h1>
    <p class="print-date">Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="profile-section">
    <h2>Personal Information</h2>
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <p><strong>Status:</strong> ${user.status}</p>
    <p><strong>Join Date:</strong> ${user.createdAt?.toLocaleDateString() || 'Unknown'}</p>
  </div>

  ${position ? `
  <div class="profile-section">
    <h2>PowerLine Position</h2>
    <p><strong>Position:</strong> #${position.position}</p>
    <p><strong>Status:</strong> ${position.status}</p>
    <p><strong>Joined Queue:</strong> ${position.joinedAt?.toLocaleDateString() || 'Unknown'}</p>
    <p><strong>Time in Queue:</strong> ${position.timeInQueue || 'Unknown'}</p>
  </div>
  ` : ''}

  <div class="profile-section">
    <h2>Recent Commissions (Last 10)</h2>
    <table>
      <thead>
        <tr>
          <th>Amount</th>
          <th>Description</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${commissions.map(comm => `
          <tr>
            <td>$${comm.amount.toFixed(2)}</td>
            <td>${comm.description}</td>
            <td>${comm.createdAt?.toLocaleDateString() || ''}</td>
            <td>${comm.verified ? 'Verified' : 'Pending'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="profile-section">
    <h2>Recent 3-Way Calls (Last 5)</h2>
    <table>
      <thead>
        <tr>
          <th>Prospect</th>
          <th>Status</th>
          <th>Scheduled Date</th>
          <th>Leader</th>
        </tr>
      </thead>
      <tbody>
        ${calls.map(call => `
          <tr>
            <td>${call.prospectName}</td>
            <td>${call.status}</td>
            <td>${(call.confirmedDateTime || call.preferredDateTime)?.toLocaleDateString() || 'TBD'}</td>
            <td>${call.assignedLeader || call.leaderPreference || 'TBD'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

module.exports = router;