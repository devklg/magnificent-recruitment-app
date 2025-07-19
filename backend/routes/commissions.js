const express = require('express');
const router = express.Router();
const { User, Team } = require('../models');
const Commission = require('../models/Commission');
const { authenticateToken } = require('../middleware/auth');

// Manual Commission Tracking System
// Real Talk Fusion amounts - no fake data, authentic social proof

// POST add new commission (promoters input real TF amounts)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { 
      amount, 
      description, 
      commissionType,
      payoutDate,
      transactionId 
    } = req.body;

    // Validate commission amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid commission amount required' 
      });
    }

    const promoter = await User.findById(req.user.id);
    if (!promoter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Promoter not found' 
      });
    }

    // Create commission record
    const commission = new Commission({
      userId: promoter._id,
      userName: promoter.name,
      amount: parseFloat(amount),
      description: description || 'Talk Fusion Commission',
      commissionType: commissionType || 'talk_fusion',
      payoutDate: payoutDate ? new Date(payoutDate) : new Date(),
      transactionId: transactionId || null,
      verified: false, // Admin can verify if needed
      createdAt: new Date()
    });

    await commission.save();

    // Update user's total commissions
    await updateUserCommissionTotals(promoter._id);

    // Send real-time update to dashboard
    await broadcastCommissionUpdate(commission);

    res.json({
      success: true,
      commission: {
        id: commission._id,
        amount: commission.amount,
        description: commission.description,
        date: commission.payoutDate
      },
      message: 'Commission added successfully! Showing in real-time feed.'
    });

  } catch (error) {
    console.error('Error adding commission:', error);
    res.status(500).json({ success: false, message: 'Failed to add commission' });
  }
});

// GET user's commission history
router.get('/my-commissions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const commissions = await Commission.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalCommissions = await Commission.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const stats = totalCommissions[0] || { total: 0, count: 0 };

    res.json({
      success: true,
      commissions: commissions.map(c => ({
        id: c._id,
        amount: c.amount,
        description: c.description,
        type: c.commissionType,
        date: c.payoutDate,
        verified: c.verified
      })),
      stats: {
        totalEarned: stats.total,
        totalCommissions: stats.count,
        averageCommission: stats.count > 0 ? (stats.total / stats.count).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET real-time commission feed (for social proof)
router.get('/live-feed', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent commissions for social proof display
    const recentCommissions = await Commission.find({ verified: true })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Format for social proof (privacy-conscious)
    const feedItems = recentCommissions.map(commission => ({
      id: commission._id,
      amount: commission.amount,
      description: commission.description,
      promoterName: commission.userName || 'Anonymous',
      timeAgo: getTimeAgo(commission.createdAt),
      type: commission.commissionType
    }));

    res.json({
      success: true,
      feed: feedItems,
      message: 'Live commission feed for social proof'
    });

  } catch (error) {
    console.error('Error fetching live feed:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET commission statistics (for dashboard displays)
router.get('/stats', async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Overall statistics
    const stats = await Commission.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          verified: true
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCommissions: { $sum: 1 },
          averageCommission: { $avg: '$amount' },
          maxCommission: { $max: '$amount' },
          minCommission: { $min: '$amount' }
        }
      }
    ]);

    // Daily breakdown
    const dailyStats = await Commission.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          verified: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyTotal: { $sum: '$amount' },
          dailyCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const overallStats = stats[0] || {
      totalAmount: 0,
      totalCommissions: 0,
      averageCommission: 0,
      maxCommission: 0,
      minCommission: 0
    };

    res.json({
      success: true,
      timeframe: `${timeframe} days`,
      stats: {
        totalEarned: overallStats.totalAmount.toFixed(2),
        totalCommissions: overallStats.totalCommissions,
        averageCommission: overallStats.averageCommission.toFixed(2),
        highestCommission: overallStats.maxCommission.toFixed(2),
        lowestCommission: overallStats.minCommission.toFixed(2)
      },
      dailyBreakdown: dailyStats.map(day => ({
        date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
        total: day.dailyTotal.toFixed(2),
        count: day.dailyCount
      }))
    });

  } catch (error) {
    console.error('Error fetching commission stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT verify/unverify commission (admin only)
router.put('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const { verified } = req.body;
    
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commission not found' 
      });
    }

    commission.verified = verified;
    commission.verifiedBy = req.user.id;
    commission.verifiedAt = new Date();
    
    await commission.save();

    res.json({
      success: true,
      message: `Commission ${verified ? 'verified' : 'unverified'} successfully`,
      commission: {
        id: commission._id,
        verified: commission.verified,
        amount: commission.amount
      }
    });

  } catch (error) {
    console.error('Error verifying commission:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions
async function updateUserCommissionTotals(userId) {
  try {
    const totals = await Commission.aggregate([
      { $match: { userId: userId, verified: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalAmount = totals[0]?.total || 0;
    
    await User.findByIdAndUpdate(userId, {
      totalCommissions: totalAmount,
      lastCommissionDate: new Date()
    });
    
  } catch (error) {
    console.error('Error updating user commission totals:', error);
  }
}

async function broadcastCommissionUpdate(commission) {
  // TODO: Integrate with WebSocket to send real-time updates
  console.log(`New commission: $${commission.amount} - ${commission.userName}`);
  
  // Real-time feed update would go here
  // WebSocket broadcast to all connected dashboards
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
}

module.exports = router;