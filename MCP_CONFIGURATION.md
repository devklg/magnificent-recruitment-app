# MCP SERVER CONFIGURATION - CLAUDE DESKTOP INTEGRATION
## Magnificent Recruitment App ShadCN-UI MCP Setup

---

## 📡 **SHADCN-UI MCP SERVER CONFIGURATION**

### **1. GET GITHUB PERSONAL ACCESS TOKEN**

**Required for 5000 requests/hour (vs 60 without token)**

1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. **No scopes needed** for public repositories
4. Copy the token (starts with `ghp_`)
5. **Save it securely** - you won't see it again!

### **2. CLAUDE DESKTOP MCP CONFIGURATION**

**Location:** `~/.config/claude-desktop/claude_desktop_config.json`

**For macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**For Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": [
        "@jpisnice/shadcn-ui-mcp-server", 
        "--github-api-key", 
        "YOUR_GITHUB_TOKEN_HERE"
      ]
    }
  }
}
```

**Replace `YOUR_GITHUB_TOKEN_HERE` with your actual GitHub token!**

### **3. RESTART CLAUDE DESKTOP**

1. **Close Claude Desktop completely**
2. **Restart the application**
3. **Verify connection** - you should see the ShadCN-UI MCP server available

---

## 🚀 **BMAD V4 AGENT USAGE INSTRUCTIONS**

### **FOR ALEXA (Frontend Lead):**

**ShadCN Component Queries:**
```
1. "List all available shadcn components"
2. "Get component demo for Button"
3. "Show me the DataTable block implementation"
4. "Get Dashboard block with demo patterns"
```

**Component Implementation Pattern:**
```
1. Query component availability
2. Get demo implementation
3. Apply scarlet theme from TweakCN
4. Implement with exact patterns
5. Test accessibility and responsiveness
```

### **VERIFICATION COMMANDS:**

**Test MCP Connection:**
```
"Use the shadcn-ui MCP server to list available components"
```

**Expected Response:**
- Should return 46+ available components
- Should include blocks (login, dashboard, analytics)
- Should show component metadata

---

## 🎯 **DEVELOPMENT WORKFLOW WITH MCP**

### **PHASE 1: COMPONENT STRUCTURE**
1. **Alexa queries MCP server** for component availability
2. **Gets component demos** for proper usage patterns  
3. **Plans UI structure** using shadcn blocks and components
4. **Implements systematically** following demo patterns

### **PHASE 2: THEME INTEGRATION**
1. **Visit TweakCN:** https://tweakcn.com/
2. **Create scarlet theme** with professional styling
3. **Export configuration** for Cursor integration
4. **Apply to components** for unique appearance

### **PHASE 3: AGENT COORDINATION**
1. **Marcus/James** design APIs for component data
2. **Alex** implements real-time WebSocket updates
3. **Quinn** tests component accessibility
4. **ACI.dev** coordinates parallel development

---

## 🔧 **TROUBLESHOOTING**

### **MCP Server Not Appearing:**
1. **Check config file location** - correct for your OS
2. **Verify JSON syntax** - no trailing commas
3. **Restart Claude Desktop** completely
4. **Check token validity** - regenerate if needed

### **Rate Limit Issues:**
1. **Verify GitHub token** is included in config
2. **Check token permissions** (public repo access)
3. **Monitor usage** - 5000 requests/hour limit

### **Component Issues:**
1. **Always get demo first** before implementing
2. **Follow exact patterns** from MCP demos
3. **Test each component** individually
4. **Apply TweakCN theme** consistently

---

## ✅ **CONFIGURATION CHECKLIST**

### **Setup Phase:**
- [ ] GitHub token generated and saved
- [ ] Claude Desktop config file updated
- [ ] MCP server configuration verified
- [ ] Claude Desktop restarted
- [ ] ShadCN-UI MCP server appears in tools

### **Testing Phase:**
- [ ] Can list available components (46+)
- [ ] Can get component demos
- [ ] Can access blocks (login, dashboard, etc.)
- [ ] Rate limits working (5000/hour)
- [ ] All agents can access MCP server

### **Development Phase:**
- [ ] TweakCN theme created
- [ ] Component demos retrieved
- [ ] Implementation following patterns
- [ ] Scarlet theme applied consistently
- [ ] Professional appearance achieved

---

## 🔥 **SUCCESS INDICATORS**

**When properly configured, you should see:**

✅ **ShadCN-UI MCP server** available in Claude Desktop tools
✅ **46+ components** available for queries
✅ **Component demos** with exact usage patterns
✅ **Blocks available** (login, dashboard, analytics)
✅ **5000 requests/hour** rate limit active
✅ **Professional components** implementing perfectly

**Result: Perfect component implementation with enterprise-grade appearance!**

---

**🚀 With proper MCP configuration, the agent trinity can build the most professional recruitment app ever created!**