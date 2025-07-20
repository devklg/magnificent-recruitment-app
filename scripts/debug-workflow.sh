#!/bin/bash
# DEBUG AGENT WORKFLOW - Troubleshooting and diagnosis tool
# Helps identify and fix common workflow issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 AGENT WORKFLOW DEBUGGER${NC}"
echo -e "${BLUE}═══════════════════════════${NC}"
echo ""

# Function to check status with colored output
check_status() {
    local description="$1"
    local command="$2"
    local fix_suggestion="$3"
    
    echo -e "${CYAN}🔍 Checking: $description${NC}"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        return 0
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        if [ -n "$fix_suggestion" ]; then
            echo -e "   ${YELLOW}💡 Fix: $fix_suggestion${NC}"
        fi
        return 1
    fi
}

# Function to display information
info_check() {
    local description="$1"
    local command="$2"
    
    echo -e "${CYAN}📋 Info: $description${NC}"
    if result=$(eval "$command" 2>/dev/null); then
        echo -e "   ${GREEN}$result${NC}"
    else
        echo -e "   ${RED}Unable to retrieve information${NC}"
    fi
}

# 1. Git Repository Status
echo -e "${YELLOW}📋 Section 1: Git Repository Status${NC}"
check_status "Git repository exists" "git rev-parse --git-dir" "Initialize with: git init"
check_status "Remote origin configured" "git remote get-url origin" "Add remote: git remote add origin <url>"
check_status "Working directory clean" "git diff --quiet && git diff --cached --quiet" "Commit or stash changes"

info_check "Current branch" "git branch --show-current"
info_check "Remote origin URL" "git remote get-url origin"
info_check "Uncommitted files" "git status --porcelain | wc -l | tr -d ' '; echo ' files'"

echo ""

# 2. Script Files Status
echo -e "${YELLOW}📋 Section 2: Workflow Scripts${NC}"
scripts=(
    "scripts/agent-workflow.sh"
    "scripts/setup-worktrees.sh" 
    "scripts/test-workflow.sh"
    "scripts/debug-workflow.sh"
)

for script in "${scripts[@]}"; do
    check_status "Script exists: $script" "[ -f '$script' ]" "Create the missing script"
    if [ -f "$script" ]; then
        check_status "Script executable: $script" "[ -x '$script' ]" "Run: chmod +x $script"
    fi
done

echo ""

# 3. Worktree Status
echo -e "${YELLOW}📋 Section 3: Worktree Status${NC}"

# List all worktrees
echo -e "${CYAN}📋 All Worktrees:${NC}"
if git worktree list > /dev/null 2>&1; then
    git worktree list | while read -r line; do
        echo -e "   ${GREEN}$line${NC}"
    done
else
    echo -e "   ${RED}No worktrees found${NC}"
fi

# Check specific agent worktrees
agents=(
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

echo ""
echo -e "${CYAN}🤖 Agent Worktree Status:${NC}"
for agent in "${agents[@]}"; do
    worktree_path="../worktrees/$agent"
    if [ -d "$worktree_path" ]; then
        echo -e "   ${GREEN}✅ $agent: $worktree_path${NC}"
        
        # Check branch in worktree
        if cd "$worktree_path" 2>/dev/null; then
            current_branch=$(git branch --show-current)
            echo -e "      📍 Branch: $current_branch"
            cd - > /dev/null
        fi
    else
        echo -e "   ${RED}❌ $agent: Missing${NC}"
        echo -e "      ${YELLOW}💡 Fix: Run ./scripts/setup-worktrees.sh${NC}"
    fi
done

echo ""

# 4. GitHub CLI Status
echo -e "${YELLOW}📋 Section 4: GitHub Integration${NC}"
check_status "GitHub CLI installed" "command -v gh" "Install gh CLI: https://cli.github.com/"

if command -v gh > /dev/null 2>&1; then
    check_status "GitHub CLI authenticated" "gh auth status" "Run: gh auth login"
    
    if gh auth status > /dev/null 2>&1; then
        info_check "GitHub user" "gh api user --jq '.login'"
        info_check "Repository access" "gh repo view --json name --jq '.name'"
    fi
fi

echo ""

# 5. Branch Status Analysis
echo -e "${YELLOW}📋 Section 5: Branch Analysis${NC}"

echo -e "${CYAN}🌿 Local Branches:${NC}"
git branch -v | while read -r line; do
    echo -e "   ${GREEN}$line${NC}"
done

echo ""
echo -e "${CYAN}🌐 Remote Branches:${NC}"
git branch -r | while read -r line; do
    echo -e "   ${GREEN}$line${NC}"
done

echo ""

# 6. Recent Activity
echo -e "${YELLOW}📋 Section 6: Recent Activity${NC}"

echo -e "${CYAN}📈 Recent Commits (last 5):${NC}"
git log --oneline -5 | while read -r line; do
    echo -e "   ${GREEN}$line${NC}"
done

echo ""
echo -e "${CYAN}🔀 Recent Pull Requests:${NC}"
if command -v gh > /dev/null 2>&1 && gh auth status > /dev/null 2>&1; then
    gh pr list --limit 5 --json number,title,headRefName | jq -r '.[] | "   #\(.number): \(.title) (\(.headRefName))"' 2>/dev/null || echo -e "   ${YELLOW}No recent PRs or unable to fetch${NC}"
else
    echo -e "   ${YELLOW}GitHub CLI not available${NC}"
fi

echo ""

# 7. Common Issues and Solutions
echo -e "${YELLOW}📋 Section 7: Common Issues & Solutions${NC}"

echo -e "${CYAN}🔧 Common Problems:${NC}"
echo -e "   ${YELLOW}Problem:${NC} Permission denied when pushing"
echo -e "   ${GREEN}Solution:${NC} Check GitHub authentication: gh auth status"
echo ""
echo -e "   ${YELLOW}Problem:${NC} Worktree already exists"
echo -e "   ${GREEN}Solution:${NC} Remove with: git worktree remove <path>"
echo ""
echo -e "   ${YELLOW}Problem:${NC} Feature branch creation fails"
echo -e "   ${GREEN}Solution:${NC} Ensure you're in correct worktree directory"
echo ""
echo -e "   ${YELLOW}Problem:${NC} PR creation fails"
echo -e "   ${GREEN}Solution:${NC} Check GitHub CLI auth and repository permissions"
echo ""

# 8. Quick Fixes
echo -e "${YELLOW}📋 Section 8: Quick Fix Commands${NC}"

echo -e "${CYAN}🔨 Quick Fix Commands:${NC}"
echo -e "   ${GREEN}Setup worktrees:${NC} ./scripts/setup-worktrees.sh"
echo -e "   ${GREEN}Make scripts executable:${NC} chmod +x scripts/*.sh"
echo -e "   ${GREEN}GitHub CLI login:${NC} gh auth login"
echo -e "   ${GREEN}Clean git state:${NC} git stash && git clean -fd"
echo -e "   ${GREEN}Test workflow:${NC} ./scripts/test-workflow.sh"
echo ""

# 9. Debug Log
echo -e "${YELLOW}📋 Section 9: Debug Environment${NC}"

info_check "Current directory" "pwd"
info_check "Current user" "whoami"
info_check "Shell" "echo \$SHELL"
info_check "Git version" "git --version"

if command -v gh > /dev/null 2>&1; then
    info_check "GitHub CLI version" "gh --version | head -1"
fi

echo ""

# Summary
echo -e "${BLUE}═══════════════════════════${NC}"
echo -e "${BLUE}🎯 DEBUG SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Debug analysis complete!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   1. Review any ${RED}❌ FAILED${NC} items above"
echo -e "   2. Apply suggested fixes"
echo -e "   3. Run test: ${YELLOW}./scripts/test-workflow.sh${NC}"
echo -e "   4. If issues persist, check individual script logs"
echo ""
echo -e "${YELLOW}💡 Need help? Check the README.md for detailed documentation${NC}"
