const express = require('express');
const router = express.Router();
const { User, Team } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// 3-Way Call Scheduling System
// Critical for recruiting process - Promoter + Prospect + Kevin/Paul/Randy

// GET available time slots for 3-way calls
router.get('/available-slots', authenticateToken, async (req, res) => {
  try {
    // Get Kevin, Paul, Randy availability
    const availability = await getLeadershipAvailability();
    
    res.json({
      success: true,
      availability: {
        kevin: availability.kevin,
        paul: availability.paul,
        randy: availability.randy
      },
      timeZones: ['PST', 'EST', 'CST', 'MST'],
      message: 'Available slots for 3-way calls'
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST schedule new 3-way call
router.post('/schedule-call', authenticateToken, async (req, res) => {
  try {
    const { 
      prospectName, 
      prospectPhone, 
      prospectEmail,
      preferredDateTime,
      timeZone,
      leaderPreference, // kevin, paul, or randy
      promoterNotes 
    } = req.body;

    const promoter = await User.findById(req.user.id);
    
    // Create scheduling request
    const schedulingRequest = {
      promoterId: promoter._id,
      promoterName: promoter.name,
      promoterPhone: promoter.phone,
      prospectName,
      prospectPhone,
      prospectEmail,
      preferredDateTime: new Date(preferredDateTime),
      timeZone,
      leaderPreference,
      promoterNotes,
      status: 'pending',
      createdAt: new Date()
    };

    // Save to database
    const newCall = await ScheduledCall.create(schedulingRequest);

    // Send notifications to leadership team
    await sendCallNotifications(newCall);

    res.json({
      success: true,
      callId: newCall._id,
      message: 'Call scheduled successfully! Leadership team will confirm within 24 hours.',
      nextSteps: [
        'Check your dashboard for confirmation',
        'Prepare your prospect for the call',
        'Review PowerLine benefits together'
      ]
    });

  } catch (error) {
    console.error('Error scheduling call:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule call' });
  }
});

// GET promoter's scheduled calls
router.get('/my-calls', authenticateToken, async (req, res) => {
  try {
    const calls = await ScheduledCall.find({ 
      promoterId: req.user.id 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      calls: calls.map(call => ({
        id: call._id,
        prospectName: call.prospectName,
        scheduledTime: call.confirmedDateTime || call.preferredDateTime,
        status: call.status,
        leader: call.assignedLeader,
        notes: call.promoterNotes
      }))
    });

  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT update call status (confirm/reschedule/cancel)
router.put('/call/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, confirmedDateTime, assignedLeader, adminNotes } = req.body;
    
    const call = await ScheduledCall.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Update call details
    call.status = status;
    if (confirmedDateTime) call.confirmedDateTime = new Date(confirmedDateTime);
    if (assignedLeader) call.assignedLeader = assignedLeader;
    if (adminNotes) call.adminNotes = adminNotes;
    
    await call.save();

    // Notify promoter of status change
    await notifyPromoterOfUpdate(call);

    res.json({
      success: true,
      message: `Call ${status} successfully`,
      call: {
        id: call._id,
        status: call.status,
        confirmedTime: call.confirmedDateTime,
        leader: call.assignedLeader
      }
    });

  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions
async function getLeadershipAvailability() {
  // Default availability - can be enhanced with calendar integration
  return {
    kevin: {
      timezone: 'PST',
      availableHours: '11:00-18:00',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    paul: {
      timezone: 'EST', 
      availableHours: '09:00-17:00',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      note: 'Permission required - Kevin will coordinate'
    },
    randy: {
      timezone: 'PST',
      availableHours: '12:00-19:00', 
      availableDays: ['Monday', 'Wednesday', 'Friday']
    }
  };
}

async function sendCallNotifications(call) {
  // Send email/SMS notifications to Kevin, Paul, Randy
  // Implementation depends on notification service
  console.log(`New 3-way call scheduled: ${call.prospectName} with ${call.promoterName}`);
  
  // TODO: Integrate with email service (nodemailer setup in package.json)
  // TODO: Send SMS notifications
  // TODO: Add to calendar systems
}

async function notifyPromoterOfUpdate(call) {
  // Notify promoter of call status changes
  console.log(`Call ${call._id} status updated to: ${call.status}`);
  
  // TODO: Send notification to promoter
  // TODO: Update real-time dashboard via WebSocket
}

module.exports = router;