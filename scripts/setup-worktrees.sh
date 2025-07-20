#!/bin/bash
# SETUP AGENT WORKTREES - Complete worktree setup and branch creation
# Creates worktrees for all 8 agents with proper branch structure

set -e

# Agent list - all 8 agents
AGENTS=(
    "alexa-frontend"
    "marcus-backend" 
    "alex-realtime"
    "quinn-qa"
    "aci-orchestration"
    "jason-security"
    "maya-integration"
    "ryan-performance"
    "elena-database"
)

WORKTREE_BASE="../worktrees"

echo "🚀 Setting up Agent Worktrees for Magnificent Recruitment App"
echo "📁 Base directory: $WORKTREE_BASE"
echo "🤖 Agents: ${AGENTS[*]}"
echo ""

# Create worktree base directory
mkdir -p "$WORKTREE_BASE"

# Function to setup agent worktree
setup_agent_worktree() {
    local agent="$1"
    local worktree_path="$WORKTREE_BASE/$agent"
    
    echo "🔧 Setting up $agent..."
    
    # Check if branch exists remotely
    if git ls-remote --heads origin "$agent" | grep -q "$agent"; then
        echo "   ✅ Remote branch '$agent' exists"
        
        # Check if worktree already exists
        if [ -d "$worktree_path" ]; then
            echo "   ♻️  Worktree already exists at $worktree_path"
        else
            # Create worktree from existing branch
            git worktree add "$worktree_path" "$agent"
            echo "   ✅ Worktree created from existing branch"
        fi
    else
        echo "   🌿 Creating new branch '$agent'"
        
        # Create new branch and worktree
        git worktree add "$worktree_path" -b "$agent"
        
        # Push the new branch to origin
        cd "$worktree_path"
        git push -u origin "$agent"
        cd - > /dev/null
        
        echo "   ✅ New branch and worktree created"
    fi
    
    # Verify worktree status
    if [ -d "$worktree_path" ]; then
        cd "$worktree_path"
        current_branch=$(git branch --show-current)
        echo "   📍 Current branch: $current_branch"
        cd - > /dev/null
    fi
    
    echo ""
}

# Setup each agent
for agent in "${AGENTS[@]}"; do
    setup_agent_worktree "$agent"
done

# List all worktrees
echo "📋 WORKTREE SUMMARY:"
git worktree list

echo ""
echo "✅ AGENT WORKTREE SETUP COMPLETE!"
echo ""
echo "🎯 Next Steps:"
echo "1. Use: ./scripts/agent-workflow.sh [agent-name] [commit-message]"
echo "2. Example: ./scripts/agent-workflow.sh alexa-frontend \"Add new dashboard component\""
echo "3. This will create feature branches and PRs automatically"
echo ""
echo "📁 Worktree Locations:"
for agent in "${AGENTS[@]}"; do
    echo "   🤖 $agent: $WORKTREE_BASE/$agent"
done
