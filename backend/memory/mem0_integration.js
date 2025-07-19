// MEM0-Style Memory Integration for Thread Continuity
// Solves the immediate working state restoration problem

const mongoose = require('mongoose');

class WorkingStateExtractor {
  constructor() {
    this.relevancyThreshold = 0.7;
    this.workingStateIndicators = [
      'currently working on',
      'next step',
      'need to implement',
      'building',
      'developing',
      'testing',
      'debugging',
      'ready for',
      'waiting for',
      'blocked by'
    ];
  }

  // Extract working state from conversation context (MEM0 approach)
  extractWorkingState(conversationText) {
    const workingState = {
      currentTasks: [],
      recentCommits: [],
      nextActions: [],
      activeAgents: [],
      urgentItems: [],
      relevancyScore: 0,
      extractedAt: new Date().toISOString()
    };

    // Parse for current tasks
    const taskPatterns = [
      /(?:currently|now|working on|building|implementing)\s+(.+?)(?:\.|,|$)/gi,
      /(?:need to|should|must)\s+(.+?)(?:\.|,|$)/gi,
      /(?:next step|next|then)\s+(.+?)(?:\.|,|$)/gi
    ];

    taskPatterns.forEach(pattern => {
      const matches = [...conversationText.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 5) {
          workingState.currentTasks.push({
            task: match[1].trim(),
            confidence: this.calculateRelevancy(match[0]),
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    // Parse for agent activity
    const agentNames = ['alexa', 'alex', 'marcus', 'james', 'quinn', 'aci.dev', 'dr. totten'];
    agentNames.forEach(agent => {
      const agentRegex = new RegExp(`${agent}[:\\s]+(.+?)(?:\\.|,|$)`, 'gi');
      const matches = [...conversationText.matchAll(agentRegex)];
      if (matches.length > 0) {
        workingState.activeAgents.push({
          agent: agent,
          lastActivity: matches[matches.length - 1][1].trim(),
          activityCount: matches.length
        });
      }
    });

    // Parse for next actions
    const actionPatterns = [
      /(?:ready to|ready for|can now|should now)\s+(.+?)(?:\.|,|$)/gi,
      /(?:next|then|after that)\s+(.+?)(?:\.|,|$)/gi
    ];

    actionPatterns.forEach(pattern => {
      const matches = [...conversationText.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 5) {
          workingState.nextActions.push({
            action: match[1].trim(),
            priority: this.calculatePriority(match[0]),
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    // Calculate overall relevancy score
    workingState.relevancyScore = this.calculateOverallRelevancy(workingState);

    return workingState;
  }

  // MEM0-style conflict resolution
  resolveConflicts(newWorkingState, existingMemories) {
    const resolution = {
      updates: [],
      additions: [],
      deletions: [],
      conflicts: []
    };

    // Compare with existing memories and resolve conflicts
    existingMemories.forEach(memory => {
      newWorkingState.currentTasks.forEach(newTask => {
        const similarity = this.calculateSimilarity(newTask.task, memory.description || '');
        
        if (similarity > 0.8) {
          // High similarity - update existing
          resolution.updates.push({
            old: memory,
            new: newTask,
            reason: 'Updated task with latest information',
            similarity: similarity
          });
        } else if (similarity > 0.5) {
          // Medium similarity - potential conflict
          resolution.conflicts.push({
            newItem: newTask,
            existingItem: memory,
            similarity: similarity,
            resolution: 'requires_review'
          });
        }
      });
    });

    // Add completely new items
    newWorkingState.currentTasks.forEach(task => {
      const isNew = !existingMemories.some(memory => 
        this.calculateSimilarity(task.task, memory.description || '') > 0.5
      );
      
      if (isNew) {
        resolution.additions.push({
          item: task,
          reason: 'New working state item detected'
        });
      }
    });

    return resolution;
  }

  // Build MEM0-style working state response
  buildWorkingStateResponse(workingState, fullContext) {
    const response = {
      immediateWorkingState: this.formatImmediateState(workingState),
      continuationContext: this.formatContinuationContext(workingState),
      nextStepRecommendations: this.generateNextSteps(workingState),
      agentStatus: this.formatAgentStatus(workingState.activeAgents),
      relevancyScore: workingState.relevancyScore,
      timestamp: new Date().toISOString()
    };

    return response;
  }

  // Format immediate working state for restore
  formatImmediateState(workingState) {
    const immediate = [];
    
    // High priority current tasks
    const highPriorityTasks = workingState.currentTasks
      .filter(task => task.confidence > 0.7)
      .slice(0, 3);
    
    if (highPriorityTasks.length > 0) {
      immediate.push('🔥 IMMEDIATE TASKS:');
      highPriorityTasks.forEach(task => {
        immediate.push(`   • ${task.task}`);
      });
    }

    // Next actions
    const urgentActions = workingState.nextActions
      .filter(action => action.priority > 0.7)
      .slice(0, 3);
      
    if (urgentActions.length > 0) {
      immediate.push('⚡ NEXT ACTIONS:');
      urgentActions.forEach(action => {
        immediate.push(`   • ${action.action}`);
      });
    }

    return immediate.join('\n');
  }

  // Helper methods
  calculateRelevancy(text) {
    const relevantWords = ['implement', 'build', 'create', 'fix', 'debug', 'test', 'deploy'];
    const words = text.toLowerCase().split(/\s+/);
    const relevantCount = words.filter(word => relevantWords.some(rel => word.includes(rel))).length;
    return Math.min(relevantCount / words.length * 2, 1);
  }

  calculatePriority(text) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'must', 'need'];
    const hasUrgent = urgentWords.some(word => text.toLowerCase().includes(word));
    return hasUrgent ? 0.9 : 0.5;
  }

  calculateSimilarity(text1, text2) {
    // Simple similarity calculation (could be enhanced with embeddings)
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  calculateOverallRelevancy(workingState) {
    const taskRelevancy = workingState.currentTasks.reduce((sum, task) => sum + task.confidence, 0) / Math.max(workingState.currentTasks.length, 1);
    const actionRelevancy = workingState.nextActions.reduce((sum, action) => sum + action.priority, 0) / Math.max(workingState.nextActions.length, 1);
    const agentActivity = Math.min(workingState.activeAgents.length / 3, 1);
    
    return (taskRelevancy + actionRelevancy + agentActivity) / 3;
  }

  formatContinuationContext(workingState) {
    return `Working on ${workingState.currentTasks.length} tasks with ${workingState.activeAgents.length} active agents`;
  }

  generateNextSteps(workingState) {
    return workingState.nextActions.slice(0, 3).map(action => action.action);
  }

  formatAgentStatus(activeAgents) {
    return activeAgents.map(agent => `${agent.agent}: ${agent.lastActivity}`);
  }
}

module.exports = WorkingStateExtractor;