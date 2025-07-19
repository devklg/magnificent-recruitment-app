// Memory API Routes - MEM0-Enhanced Thread Continuity
// Provides immediate working state restoration endpoints

const express = require('express');
const router = express.Router();
const { EnhancedThreadContinuity } = require('../memory/enhanced_thread_continuity');

const threadContinuity = new EnhancedThreadContinuity();

// Save thread state with MEM0-style working state extraction
router.post('/save-thread-state', async (req, res) => {
  try {
    const { threadId, summary, context, metadata } = req.body;

    if (!threadId || !summary || !context) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: threadId, summary, context'
      });
    }

    const result = await threadContinuity.saveThreadState(
      threadId,
      summary, 
      context,
      metadata || {}
    );

    res.json({
      success: true,
      message: 'Thread state saved with MEM0-style working state extraction',
      data: result
    });

  } catch (error) {
    console.error('Save thread state error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save thread state',
      error: error.message
    });
  }
});

// Restore thread state with immediate working state
router.get('/restore-thread-state/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;

    const result = await threadContinuity.restoreThreadState(threadId);

    if (!result.restored) {
      return res.status(404).json({
        success: false,
        message: result.message,
        context: result.context
      });
    }

    res.json({
      success: true,
      message: 'Thread state restored with immediate working state',
      data: result
    });

  } catch (error) {
    console.error('Restore thread state error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore thread state',
      error: error.message
    });
  }
});

// List all available threads with working state info
router.get('/threads', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await threadContinuity.listThreads(parseInt(limit));

    res.json({
      success: true,
      message: 'Available threads with working state information',
      data: result
    });

  } catch (error) {
    console.error('List threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list threads',
      error: error.message
    });
  }
});

// Get MEM0 integration system status
router.get('/system-status', async (req, res) => {
  try {
    const status = await threadContinuity.getSystemStatus();

    res.json({
      success: true,
      message: 'MEM0 integration system status',
      data: status
    });

  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    });
  }
});

// Kevin's restore command - simplified endpoint
router.post('/restore', async (req, res) => {
  try {
    // Default to 'current-session' if no threadId provided
    const threadId = req.body.threadId || 'current-session';
    
    const result = await threadContinuity.restoreThreadState(threadId);

    if (!result.restored) {
      return res.json({
        success: false,
        message: "No recent session found. Starting fresh.",
        recommendation: "Save current session state for future restore capability"
      });
    }

    // Return formatted response for Kevin's restore command
    res.json({
      success: true,
      restored: true,
      immediateWorkingState: result.immediateWorkingState,
      relevancyScore: result.relevancyScore,
      lastSaved: result.lastSaved,
      message: "Thread continuity restored - ready for immediate continuation"
    });

  } catch (error) {
    console.error('Kevin restore command error:', error);
    res.status(500).json({
      success: false,
      message: 'Restore command failed',
      error: error.message
    });
  }
});

// Auto-save current session (for background saving)
router.post('/auto-save', async (req, res) => {
  try {
    const { context, metadata } = req.body;
    const threadId = 'current-session';
    const summary = `Auto-saved session at ${new Date().toISOString()}`;

    const result = await threadContinuity.saveThreadState(
      threadId,
      summary,
      context || {},
      { ...metadata, autoSave: true }
    );

    res.json({
      success: true,
      message: 'Session auto-saved with working state extraction',
      relevancyScore: result.relevancyScore,
      indicators: result.indicators
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-save failed',
      error: error.message
    });
  }
});

// Health check for memory system
router.get('/health', async (req, res) => {
  try {
    const status = await threadContinuity.getSystemStatus();
    
    res.json({
      success: true,
      status: 'operational',
      message: 'MEM0-enhanced memory system ready',
      performance: status.performance,
      features: [
        'Working state extraction',
        'Immediate thread restoration', 
        'Conflict resolution',
        'Relevancy scoring',
        'Agent activity tracking'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Memory system health check failed',
      error: error.message
    });
  }
});

module.exports = router;