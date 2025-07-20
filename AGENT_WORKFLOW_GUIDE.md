# 🚀 Agent Workflow System - Complete Guide

## Overview

The Agent Workflow System provides a seamless **worktree → feature branch → PR** workflow for the 8-agent development team. This system ensures proper code isolation, automated PR creation, and clean merge processes.

## 🎯 Key Benefits

- ✅ **Fixed Commit Workflow**: No more direct commits to main
- ✅ **Feature Branch Isolation**: Each change gets its own branch
- ✅ **Automated PR Creation**: GitHub PRs created automatically
- ✅ **8-Agent Support**: Complete worktree system for all agents
- ✅ **Professional Workflow**: Enterprise-grade Git practices

## 🤖 The 8 Agents

1. **alexa-frontend** - React/TypeScript frontend components
2. **marcus-backend** - Node.js/Express backend services  
3. **alex-realtime** - WebSocket/real-time features
4. **quinn-qa** - Testing, validation, quality assurance
5. **aci-orchestration** - Development coordination
6. **jason-security** - Security, authentication, authorization
7. **maya-integration** - API integrations, data sync
8. **ryan-performance** - Performance optimization, monitoring
9. **elena-database** - Database design, migrations, queries

## 📋 Quick Start

### 1. Initial Setup
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Setup all agent worktrees
./scripts/setup-worktrees.sh

# Test the complete system
./scripts/test-workflow.sh
```

### 2. Daily Development Workflow
```bash
# Standard agent workflow
./scripts/agent-workflow.sh [agent-name] [commit-message] [files...]

# Examples:
./scripts/agent-workflow.sh alexa-frontend "Add new dashboard component"
./scripts/agent-workflow.sh marcus-backend "Implement user authentication API"
./scripts/agent-workflow.sh alex-realtime "Add WebSocket connection handling"
```

### 3. If Issues Arise
```bash
# Debug and troubleshoot
./scripts/debug-workflow.sh
```

## 🔧 Detailed Script Documentation

### `agent-workflow.sh` - Main Workflow Script

**Purpose**: Creates feature branches, commits changes, and creates PRs automatically

**Usage**: 
```bash
./scripts/agent-workflow.sh [agent-name] [commit-message] [files...]
```

**Parameters**:
- `agent-name`: One of the 8 agents (e.g., alexa-frontend)
- `commit-message`: Description of changes
- `files...`: Optional specific files (defaults to all changes)

**Process**:
1. Creates feature branch: `feature/[agent]-[timestamp]`
2. Commits changes with agent prefix: `🤖 [AGENT]: [message]`
3. Pushes feature branch to origin
4. Creates GitHub PR automatically (if gh CLI available)
5. Returns to main directory

**Examples**:
```bash
# Commit all changes for alexa-frontend
./scripts/agent-workflow.sh alexa-frontend "Update dashboard styling"

# Commit specific files for marcus-backend
./scripts/agent-workflow.sh marcus-backend "Add user routes" src/routes/users.js

# Quinn QA workflow
./scripts/agent-workflow.sh quinn-qa "Add integration tests"
```

### `setup-worktrees.sh` - Worktree Setup

**Purpose**: Sets up the complete 8-agent worktree system

**Usage**:
```bash
./scripts/setup-worktrees.sh
```

**What it does**:
- Creates `../worktrees/` directory structure
- Sets up worktree for each agent
- Creates agent branches if they don't exist
- Pushes new branches to origin
- Verifies worktree configuration

**Directory Structure Created**:
```
../worktrees/
├── alexa-frontend/     (worktree for alexa-frontend branch)
├── marcus-backend/     (worktree for marcus-backend branch) 
├── alex-realtime/      (worktree for alex-realtime branch)
├── quinn-qa/           (worktree for quinn-qa branch)
├── aci-orchestration/  (worktree for aci-orchestration branch)
├── jason-security/     (worktree for jason-security branch)
├── maya-integration/   (worktree for maya-integration branch)
├── ryan-performance/   (worktree for ryan-performance branch)
└── elena-database/     (worktree for elena-database branch)
```

### `test-workflow.sh` - End-to-End Testing

**Purpose**: Validates the complete workflow system

**Usage**:
```bash
./scripts/test-workflow.sh
```

**Test Process**:
1. **Script Validation**: Checks all scripts exist and are executable
2. **Git Configuration**: Verifies repository and remote setup
3. **Worktree Setup**: Ensures worktrees exist or creates them
4. **Test File Creation**: Creates a test file in agent worktree
5. **Workflow Execution**: Runs complete agent workflow
6. **Result Verification**: Confirms feature branch and PR creation
7. **Cleanup**: Documents manual cleanup steps

### `debug-workflow.sh` - Troubleshooting Tool

**Purpose**: Diagnoses and fixes common workflow issues

**Usage**:
```bash
./scripts/debug-workflow.sh
```

**Diagnostic Areas**:
- Git repository status
- Script file permissions
- Worktree configuration
- GitHub CLI setup
- Branch analysis
- Recent activity review
- Common issue solutions

## 🌿 Workflow Process Deep Dive

### Traditional Problem (Fixed)
```
❌ OLD: Agent work → Direct commit to main → Merge conflicts
```

### New Solution
```
✅ NEW: Agent work → Feature branch → PR → Review → Merge
```

### Detailed Flow
1. **Agent starts work** in their dedicated worktree
2. **Script creates** `feature/agent-timestamp` branch from agent branch
3. **Changes committed** with consistent formatting
4. **Feature branch pushed** to origin
5. **PR created automatically** with proper description
6. **Review process** through GitHub interface
7. **Merge to main** when approved
8. **Feature branch cleanup** (manual or automated)

## 🔗 GitHub Integration

### GitHub CLI Setup (Recommended)
```bash
# Install GitHub CLI
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: See https://cli.github.com/

# Authenticate
gh auth login

# Verify setup
gh auth status
```

### Manual PR Creation (Fallback)
If GitHub CLI isn't available, the script provides a URL for manual PR creation:
```
https://github.com/devklg/magnificent-recruitment-app/compare/main...feature/agent-timestamp?quick_pull=1
```

## 📁 Directory Structure

```
magnificent-recruitment-app/
├── scripts/
│   ├── agent-workflow.sh      # Main workflow script
│   ├── setup-worktrees.sh     # Worktree setup
│   ├── test-workflow.sh       # End-to-end testing
│   ├── debug-workflow.sh      # Troubleshooting
│   ├── activate-agents.sh     # Agent activation
│   ├── setup-development.sh   # Development setup
│   └── start-development.sh   # Development servers
├── agents/                    # Agent rule files
├── frontend/                  # React application
├── backend/                   # Node.js backend
└── ../worktrees/             # Agent worktrees (outside main repo)
    ├── alexa-frontend/
    ├── marcus-backend/
    └── ... (all 8 agents)
```

## 🛠️ Advanced Usage

### Working in Agent Worktrees
```bash
# Navigate to agent worktree
cd ../worktrees/alexa-frontend

# Normal git operations work
git status
git log
git branch

# But use workflow script for commits
cd ../../magnificent-recruitment-app
./scripts/agent-workflow.sh alexa-frontend "Your changes"
```

### Custom Feature Branch Names
The system automatically generates feature branch names:
```
feature/alexa-frontend-20250720-120530
feature/marcus-backend-20250720-120645
```

### Multiple File Commits
```bash
# Commit specific files
./scripts/agent-workflow.sh alexa-frontend "Update components" \
  src/components/Dashboard.tsx \
  src/components/Sidebar.tsx \
  src/styles/dashboard.css
```

### PR Templates
PRs are created with a standard template:
```markdown
**Agent:** alexa-frontend
**Feature Branch:** feature/alexa-frontend-20250720-120530
**Base Branch:** main

## Changes
Update dashboard components with new styling

## Workflow Info
- ✅ Created via automated agent workflow
- 🤖 Agent: alexa-frontend  
- 🌿 Feature branch: feature/alexa-frontend-20250720-120530
- 📅 Timestamp: Sat Jul 20 12:05:30 2025

**Ready for review and merge! 🚀**
```

## 🚨 Troubleshooting

### Common Issues

**Issue**: Permission denied when pushing
```bash
# Check GitHub authentication
gh auth status
gh auth login
```

**Issue**: Worktree already exists
```bash
# Remove existing worktree
git worktree remove ../worktrees/[agent-name]
# Or force remove
git worktree remove --force ../worktrees/[agent-name]
```

**Issue**: Feature branch creation fails
```bash
# Ensure you're in the correct directory
pwd  # Should be in main repo, not worktree
./scripts/debug-workflow.sh  # Run full diagnosis
```

**Issue**: Script not executable
```bash
# Make all scripts executable
chmod +x scripts/*.sh
```

### Debug Process
1. Run `./scripts/debug-workflow.sh`
2. Check all ❌ FAILED items
3. Apply suggested fixes
4. Re-run test: `./scripts/test-workflow.sh`

## 🎯 Best Practices

### Commit Messages
- Use descriptive, action-oriented messages
- Keep under 50 characters for title
- Use agent-specific context

### Branch Management
- Feature branches are temporary - delete after merge
- Don't work directly in agent branches
- Always use the workflow script for commits

### Code Review
- Review PRs before merging
- Use GitHub's review features
- Merge using "Squash and merge" for clean history

### Agent Coordination
- Each agent owns their domain
- Cross-agent changes require coordination
- Use ACI.dev (orchestration agent) for coordination

## 📈 Workflow Metrics

Track your workflow efficiency:
- **Feature branches created**: Use `git branch -r | grep feature | wc -l`
- **PRs this week**: Use `gh pr list --json createdAt | jq length`
- **Agent activity**: Use `git shortlog --since="1 week" --grep="🤖"`

## 🔮 Future Enhancements

- Automated testing on feature branches
- Auto-merge for approved PRs
- Slack/Discord notifications
- Performance metrics integration
- Code quality checks

## 📞 Support

If you encounter issues:
1. Run `./scripts/debug-workflow.sh`
2. Check this documentation
3. Review GitHub repository settings
4. Verify GitHub CLI authentication

**Remember**: This system ensures clean, professional Git workflow for the entire 8-agent team! 🚀
