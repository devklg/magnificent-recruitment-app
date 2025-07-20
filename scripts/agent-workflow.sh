#!/bin/bash
# AGENT WORKFLOW SCRIPT - Feature Branch + PR Creation
# Usage: ./agent-workflow.sh [agent-name] [commit-message] [files...]

set -e

AGENT_NAME="$1"
COMMIT_MESSAGE="$2"
shift 2
FILES=("$@")

# Validate inputs
if [ -z "$AGENT_NAME" ] || [ -z "$COMMIT_MESSAGE" ]; then
    echo "❌ Usage: ./agent-workflow.sh [agent-name] [commit-message] [files...]"
    echo "📋 Available agents: alexa-frontend, marcus-backend, alex-realtime, quinn-qa, aci-orchestration"
    exit 1
fi

# Generate feature branch name with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FEATURE_BRANCH="feature/${AGENT_NAME}-${TIMESTAMP}"

echo "🚀 Starting Agent Workflow for: $AGENT_NAME"
echo "📝 Commit Message: $COMMIT_MESSAGE"
echo "🌿 Feature Branch: $FEATURE_BRANCH"

# Ensure we're in the worktree for this agent
WORKTREE_PATH="../worktrees/${AGENT_NAME}"
if [ ! -d "$WORKTREE_PATH" ]; then
    echo "❌ Worktree not found: $WORKTREE_PATH"
    echo "🔧 Run: git worktree add $WORKTREE_PATH $AGENT_NAME"
    exit 1
fi

cd "$WORKTREE_PATH"

# Create and switch to feature branch
echo "🌿 Creating feature branch from $AGENT_NAME..."
git checkout -b "$FEATURE_BRANCH"

# Add specified files or all changes
if [ ${#FILES[@]} -eq 0 ]; then
    echo "📁 Adding all changes..."
    git add .
else
    echo "📁 Adding specified files: ${FILES[*]}"
    git add "${FILES[@]}"
fi

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "⚠️  No changes to commit"
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "🤖 $AGENT_NAME: $COMMIT_MESSAGE"

# Push feature branch to origin
echo "⬆️  Pushing feature branch to origin..."
git push origin "$FEATURE_BRANCH"

# Create Pull Request using GitHub CLI or API
echo "🔀 Creating Pull Request..."

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    # Use GitHub CLI
    gh pr create \
        --title "🤖 $AGENT_NAME: $COMMIT_MESSAGE" \
        --body "**Agent:** $AGENT_NAME  
**Feature Branch:** \`$FEATURE_BRANCH\`  
**Base Branch:** \`main\`  

## Changes
$COMMIT_MESSAGE

## Workflow Info
- ✅ Created via automated agent workflow
- 🤖 Agent: $AGENT_NAME
- 🌿 Feature branch: $FEATURE_BRANCH
- 📅 Timestamp: $(date)

**Ready for review and merge! 🚀**" \
        --base main \
        --head "$FEATURE_BRANCH"
        
    echo "✅ Pull Request created successfully!"
    
else
    # Fallback: Manual PR creation URL
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    PR_URL="$REPO_URL/compare/main...$FEATURE_BRANCH?quick_pull=1"
    
    echo "📋 GitHub CLI not found. Create PR manually:"
    echo "🔗 $PR_URL"
fi

# Return to original directory
cd - > /dev/null

echo ""
echo "✅ AGENT WORKFLOW COMPLETE!"
echo "🤖 Agent: $AGENT_NAME"
echo "🌿 Feature Branch: $FEATURE_BRANCH"
echo "📝 Commit: $COMMIT_MESSAGE"
echo "🔀 Pull Request: Ready for review"
echo ""
echo "🎯 Next Steps:"
echo "1. Review the PR in GitHub"
echo "2. Merge when ready"
echo "3. Delete feature branch after merge"
