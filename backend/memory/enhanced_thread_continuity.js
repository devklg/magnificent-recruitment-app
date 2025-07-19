// Enhanced Thread Continuity with MEM0 Integration
// Provides immediate working state restoration

const WorkingStateExtractor = require('./mem0_integration');
const mongoose = require('mongoose');

// Enhanced Memory Schema for thread continuity
const MemoryStateSchema = new mongoose.Schema({
  threadId: { type: String, required: true, unique: true },
  workingState: {
    currentTasks: [{
      task: String,
      confidence: Number,
      timestamp: Date
    }],
    recentCommits: [{
      message: String,
      files: [String],
      timestamp: Date
    }],
    nextActions: [{
      action: String,
      priority: Number,
      timestamp: Date
    }],
    activeAgents: [{
      agent: String,
      lastActivity: String,
      activityCount: Number
    }],
    urgentItems: [String],
    relevancyScore: Number,
    extractedAt: Date
  },
  conversationContext: mongoose.Schema.Types.Mixed,
  metadata: {
    conversationRecorded: Boolean,
    rulesChecked: Boolean,
    toolsUsed: [String],
    sessionLength: Number,
    lastActiveAgent: String
  },
  summary: String,
  savedAt: { type: Date, default: Date.now },
  version: { type: String, default: '2.0-mem0' }
});

const MemoryState = mongoose.model('MemoryState', MemoryStateSchema);

class EnhancedThreadContinuity {
  constructor() {
    this.workingStateExtractor = new WorkingStateExtractor();
  }

  // Save thread state with MEM0-style working state extraction
  async saveThreadState(threadId, summary, context, metadata = {}) {
    try {
      // Extract working state from conversation context
      const contextText = JSON.stringify(context);
      const workingState = this.workingStateExtractor.extractWorkingState(contextText);

      // Get existing memories for conflict resolution
      const existingMemories = await this.getExistingMemories(threadId);
      
      // Apply MEM0-style conflict resolution
      const resolution = this.workingStateExtractor.resolveConflicts(
        workingState, 
        existingMemories
      );

      // Create enhanced memory state
      const memoryState = new MemoryState({
        threadId,
        workingState,
        conversationContext: context,
        metadata: {
          ...metadata,
          mem0Integration: true,
          extractionMethod: 'MEM0-style',
          conflictResolution: resolution,
          workingStateIndicators: workingState.currentTasks.length + 
                                workingState.nextActions.length +
                                workingState.activeAgents.length
        },
        summary
      });

      // Save with upsert to replace existing thread state
      const result = await MemoryState.findOneAndUpdate(
        { threadId },
        memoryState.toObject(),
        { upsert: true, new: true }
      );

      return {
        saved: true,
        threadId: threadId,
        workingStateExtracted: true,
        relevancyScore: workingState.relevancyScore,
        indicators: {
          currentTasks: workingState.currentTasks.length,
          nextActions: workingState.nextActions.length,
          activeAgents: workingState.activeAgents.length,
          conflicts: resolution.conflicts.length
        },
        memoryId: result._id
      };

    } catch (error) {
      console.error('Enhanced save error:', error);
      throw new Error(`Failed to save thread state: ${error.message}`);
    }
  }

  // Restore thread state with MEM0-style working state prioritization
  async restoreThreadState(threadId) {
    try {
      // Get the most recent thread state
      const memoryState = await MemoryState.findOne({ threadId })
        .sort({ savedAt: -1 });
      
      if (!memoryState) {
        return {
          restored: false,
          message: "No thread state found for restoration",
          context: this.getEmptyContext()
        };
      }

      // Build MEM0-style working state response
      const workingStateResponse = this.workingStateExtractor.buildWorkingStateResponse(
        memoryState.workingState,
        memoryState.conversationContext
      );

      // Format immediate working state for user
      const immediateState = this.formatImmediateWorkingState(memoryState.workingState);

      return {
        restored: true,
        threadId: threadId,
        immediateWorkingState: immediateState,
        workingStateResponse: workingStateResponse,
        context: memoryState.conversationContext,
        relevancyScore: memoryState.workingState.relevancyScore,
        metadata: memoryState.metadata,
        lastSaved: memoryState.savedAt,
        summary: memoryState.summary
      };

    } catch (error) {
      console.error('Enhanced restore error:', error);
      throw new Error(`Failed to restore thread state: ${error.message}`);
    }
  }

  // Format immediate working state for Kevin's restore command
  formatImmediateWorkingState(workingState) {
    const lines = [];
    
    lines.push('🚀 WORKING STATE RESTORED');
    lines.push('');

    // Current tasks with high confidence
    const importantTasks = workingState.currentTasks
      .filter(task => task.confidence > 0.6)
      .slice(0, 5);
    
    if (importantTasks.length > 0) {
      lines.push('📋 IMMEDIATE TASKS:');
      importantTasks.forEach(task => {
        lines.push(`   • ${task.task}`);
      });
      lines.push('');
    }

    // Active agents
    if (workingState.activeAgents.length > 0) {
      lines.push('🤖 ACTIVE AGENTS:');
      workingState.activeAgents.forEach(agent => {
        lines.push(`   • ${agent.agent.toUpperCase()}: ${agent.lastActivity}`);
      });
      lines.push('');
    }

    // Next actions with high priority
    const urgentActions = workingState.nextActions
      .filter(action => action.priority > 0.6)
      .slice(0, 3);
    
    if (urgentActions.length > 0) {
      lines.push('⚡ NEXT ACTIONS:');
      urgentActions.forEach(action => {
        lines.push(`   • ${action.action}`);
      });
      lines.push('');
    }

    lines.push(`✅ Ready for immediate continuation (Relevancy: ${(workingState.relevancyScore * 100).toFixed(1)}%)`);
    
    return lines.join('\n');
  }

  // Get existing memories for conflict resolution
  async getExistingMemories(threadId) {
    try {
      const existingState = await MemoryState.findOne({ threadId });
      return existingState ? existingState.workingState.currentTasks : [];
    } catch (error) {
      console.error('Error getting existing memories:', error);
      return [];
    }
  }

  // List all available threads with working state info
  async listThreads(limit = 10) {
    try {
      const threads = await MemoryState.find({})
        .sort({ savedAt: -1 })
        .limit(limit)
        .select('threadId summary workingState.relevancyScore savedAt workingState.activeAgents');

      return {
        threads: threads.map(thread => ({
          threadId: thread.threadId,
          summary: thread.summary,
          relevancyScore: thread.workingState.relevancyScore,
          activeAgents: thread.workingState.activeAgents.length,
          lastSaved: thread.savedAt,
          timeSinceLastSave: this.getTimeSinceLastSave(thread.savedAt)
        })),
        total: threads.length
      };

    } catch (error) {
      console.error('Error listing threads:', error);
      throw new Error(`Failed to list threads: ${error.message}`);
    }
  }

  // Get system status for MEM0 integration
  async getSystemStatus() {
    try {
      const totalThreads = await MemoryState.countDocuments({});
      const highRelevancyThreads = await MemoryState.countDocuments({
        'workingState.relevancyScore': { $gte: 0.7 }
      });
      
      const recentThreads = await MemoryState.countDocuments({
        savedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        status: 'operational',
        integration: 'MEM0-enhanced',
        performance: {
          totalThreads,
          highRelevancyThreads,
          recentThreads,
          enhancementRate: totalThreads > 0 ? 
            ((highRelevancyThreads / totalThreads) * 100).toFixed(1) + '%' : '0%'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Utility methods
  getEmptyContext() {
    return {
      conversation_count: 0,
      thread_summary: 'New thread - no previous context',
      workingState: {
        currentTasks: [],
        recentCommits: [],
        nextActions: [],
        activeAgents: [],
        urgentItems: [],
        relevancyScore: 0
      }
    };
  }

  getTimeSinceLastSave(savedAt) {
    const seconds = Math.floor((new Date() - savedAt) / 1000);
    
    if (seconds < 60) return 'Just saved';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
  }
}

module.exports = { EnhancedThreadContinuity, MemoryState };