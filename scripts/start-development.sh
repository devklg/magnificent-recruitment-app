#!/bin/bash
echo "🚀 Starting Magnificent Recruitment App Development Environment"

# Start shadcn-ui MCP server (user needs to add their token)
echo "📡 To start ShadCN-UI MCP Server with your token:"
echo "npx @jpisnice/shadcn-ui-mcp-server --github-api-key \$GITHUB_TOKEN"
echo ""

# Start backend development server
echo "🔧 Starting Backend Server..."
cd backend
if [ -f "package.json" ] && grep -q '"dev"' package.json; then
    npm run dev &
else
    echo "Backend dev script not configured yet - run setup first"
fi
cd ..

# Start frontend development server  
echo "🎨 Starting Frontend Server..."
cd frontend
if [ -f "package.json" ]; then
    npm run dev &
else
    echo "Frontend not configured yet - run setup first"
fi
cd ..

echo "✅ Development servers starting!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3001" 
echo "Remember to start MongoDB and ShadCN-UI MCP server separately"