const express = require('express');
const router = express.Router();
const { User, Team } = require('../models');
const PowerLinePosition = require('../models/PowerLinePosition');
const { authenticateToken } = require('../middleware/auth');

// PowerLine Specific Functionality
// Sequential queue system, position management, tree visualization

// GET current PowerLine queue status
router.get('/queue-status', async (req, res) => {
  try {
    // Get total positions in queue
    const totalPositions = await PowerLinePosition.countDocuments();
    
    // Get recent additions (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentAdditions = await PowerLinePosition.countDocuments({
      joinedAt: { $gte: yesterday }
    });

    // Get position range for display
    const queueSample = await PowerLinePosition.find()
      .sort({ position: 1 })
      .limit(10)
      .populate('userId', 'name email');

    res.json({
      success: true,
      queueStats: {
        totalPositions,
        recentAdditions,
        queueSample: queueSample.map(pos => ({
          position: pos.position,
          name: pos.displayName,
          timeInQueue: pos.timeInQueue,
          status: pos.status
        }))
      },
      message: 'Live queue status'
    });

  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET user's position in PowerLine
router.get('/my-position', authenticateToken, async (req, res) => {
  try {
    const userPosition = await PowerLinePosition.findOne({ 
      userId: req.user.id 
    }).populate('sponsorId', 'name email');

    if (!userPosition) {
      return res.json({
        success: true,
        hasPosition: false,
        message: 'No PowerLine position found'
      });
    }

    // Get positions ahead and behind
    const positionsAhead = await PowerLinePosition.countDocuments({
      position: { $lt: userPosition.position }
    });

    const positionsBehind = await PowerLinePosition.countDocuments({
      position: { $gt: userPosition.position }
    });

    // Get recent activity in user's area
    const nearbyActivity = await PowerLinePosition.find({
      position: {
        $gte: userPosition.position - 5,
        $lte: userPosition.position + 5
      }
    }).sort({ position: 1 }).select('position displayName joinedAt');

    res.json({
      success: true,
      hasPosition: true,
      position: {
        number: userPosition.position,
        joinedAt: userPosition.joinedAt,
        sponsor: userPosition.sponsorId ? {
          name: userPosition.sponsorId.name,
          email: userPosition.sponsorId.email
        } : null,
        status: userPosition.status
      },
      queueInfo: {
        positionsAhead,
        positionsBehind,
        nearbyActivity: nearbyActivity.map(pos => ({
          position: pos.position,
          name: pos.displayName,
          joinedAt: pos.joinedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user position:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST enroll in PowerLine (secure the position)
router.post('/enroll', authenticateToken, async (req, res) => {
  try {
    const { sponsorId, displayName } = req.body;

    // Check if user already has a position
    const existingPosition = await PowerLinePosition.findOne({ 
      userId: req.user.id 
    });

    if (existingPosition) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a PowerLine position',
        position: existingPosition.position
      });
    }

    // Verify sponsor exists (if provided)
    let sponsor = null;
    if (sponsorId) {
      sponsor = await User.findById(sponsorId);
      if (!sponsor) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid sponsor ID' 
        });
      }
    }

    // Get next available position number
    const lastPosition = await PowerLinePosition.findOne()
      .sort({ position: -1 });
    
    const nextPosition = lastPosition ? lastPosition.position + 1 : 1;

    // Create new PowerLine position
    const newPosition = new PowerLinePosition({
      userId: req.user.id,
      position: nextPosition,
      displayName: displayName || 'PowerLine Member',
      sponsorId: sponsorId || null,
      status: 'active',
      joinedAt: new Date(),
      source: 'powerline_enrollment'
    });

    await newPosition.save();

    // Update user's PowerLine status
    await User.findByIdAndUpdate(req.user.id, {
      powerLinePosition: nextPosition,
      powerLineSponsor: sponsorId || null,
      powerLineJoinDate: new Date()
    });

    // Send welcome notifications
    await sendWelcomeNotifications(newPosition, sponsor);

    res.json({
      success: true,
      position: {
        number: nextPosition,
        sponsor: sponsor ? sponsor.name : null,
        joinedAt: newPosition.joinedAt
      },
      message: `Congratulations! Your PowerLine position #${nextPosition} has been secured!`,
      nextSteps: [
        'Contact your sponsor to learn about the opportunity',
        'Share your PowerLine invitation with others',
        'Watch the queue grow behind you'
      ]
    });

  } catch (error) {
    console.error('Error enrolling in PowerLine:', error);
    res.status(500).json({ success: false, message: 'Enrollment failed' });
  }
});

// GET PowerLine tree visualization data
router.get('/tree/:position?', async (req, res) => {
  try {
    const { position = 1 } = req.params;
    const { levels = 3 } = req.query;

    // Get positions for tree visualization
    const startPosition = parseInt(position);
    const endPosition = startPosition + Math.pow(2, levels) - 1;

    const treePositions = await PowerLinePosition.find({
      position: { $gte: startPosition, $lte: endPosition }
    }).sort({ position: 1 }).populate('userId', 'name email').lean();

    // Build tree structure
    const treeData = buildTreeStructure(treePositions, startPosition, levels);

    res.json({
      success: true,
      tree: {
        startPosition,
        levels,
        totalPositions: treePositions.length,
        structure: treeData
      }
    });

  } catch (error) {
    console.error('Error fetching tree data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET PowerLine growth animation data
router.get('/growth-feed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get recent position additions for animation
    const recentPositions = await PowerLinePosition.find()
      .sort({ joinedAt: -1 })
      .limit(parseInt(limit))
      .select('position displayName joinedAt status');

    const growthFeed = recentPositions.map(pos => ({
      position: pos.position,
      name: pos.displayName,
      timeAgo: getTimeAgo(pos.joinedAt),
      status: pos.status
    }));

    res.json({
      success: true,
      growthFeed,
      stats: {
        totalShowing: growthFeed.length,
        newestPosition: growthFeed[0]?.position || 0,
        oldestPosition: growthFeed[growthFeed.length - 1]?.position || 0
      }
    });

  } catch (error) {
    console.error('Error fetching growth feed:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET PowerLine statistics for admin
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Verify admin access
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { timeframe = 7 } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Overall statistics
    const stats = await PowerLinePosition.aggregate([
      {
        $facet: {
          total: [
            { $count: "total" }
          ],
          recent: [
            { $match: { joinedAt: { $gte: startDate } } },
            { $count: "recent" }
          ],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          dailyGrowth: [
            {
              $match: { joinedAt: { $gte: startDate } }
            },
            {
              $group: {
                _id: {
                  year: { $year: "$joinedAt" },
                  month: { $month: "$joinedAt" },
                  day: { $dayOfMonth: "$joinedAt" }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      timeframe: `${timeframe} days`,
      stats: {
        totalPositions: result.total[0]?.total || 0,
        recentAdditions: result.recent[0]?.recent || 0,
        statusBreakdown: result.byStatus,
        dailyGrowth: result.dailyGrowth.map(day => ({
          date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
          additions: day.count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions
function buildTreeStructure(positions, startPosition, levels) {
  const tree = {};
  
  positions.forEach(pos => {
    const level = Math.floor(Math.log2(pos.position - startPosition + 1));
    if (level < levels) {
      if (!tree[level]) tree[level] = [];
      tree[level].push({
        position: pos.position,
        name: pos.displayName,
        status: pos.status,
        hasUser: !!pos.userId
      });
    }
  });
  
  return tree;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

async function sendWelcomeNotifications(position, sponsor) {
  console.log(`Welcome to PowerLine position #${position.position}!`);
  
  // TODO: Send welcome email
  // TODO: Notify sponsor of new team member
  // TODO: Add to real-time growth feed
}

module.exports = router;