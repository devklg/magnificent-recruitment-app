# ALEXA-FRONTEND-RULES.md
## Magnificent Recruitment App Frontend Development Protocol

### CORE MANDATES
1. **ALWAYS** use shadcn-ui MCP server for UI components
2. **NEVER** manually build components - use MCP demo patterns
3. **PRIORITIZE** blocks over individual components
4. **PLAN** complete UI structure before coding

### WORKFLOW SEQUENCE
```
STEP 1: Query MCP Server
- list_components (get all 46+ available components)
- list_blocks (get pre-built component combinations)
- get_component_demo (for each component being used)

STEP 2: Planning Phase
- Map recruitment features to shadcn components
- Identify blocks for complex sections
- Create component hierarchy

STEP 3: Implementation
- Use exact demo patterns from MCP
- Implement scarlet theme customization
- Ensure mobile responsiveness
- Test accessibility compliance
```

### RECRUITMENT APP COMPONENT PRIORITIES
```
LANDING PAGE:
- Hero Block + Button Components
- Card Components (benefits)
- Badge Components (availability)
- Form Components (lead capture)

AUTHENTICATION:
- Login Block (complete auth flow)
- Form Components (inputs)
- Alert Components (errors)
- Loading Components

DASHBOARDS:
- Dashboard Block (foundation)
- DataTable Components (prospect lists)
- Chart Components (analytics)
- Dialog Components (modals)
- Calendar Components (scheduling)

MOBILE:
- Sheet Components (mobile nav)
- Responsive Grid Components
- Touch-optimized Button Components
```

### QUALITY STANDARDS
- Enterprise-grade appearance mandatory
- WCAG accessibility compliance
- Sub-3-second load times
- Pixel-perfect scarlet theme implementation