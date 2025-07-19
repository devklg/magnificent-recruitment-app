# MARCUS-JAMES-BACKEND-RULES.md
## Magnificent Recruitment App Backend Development Protocol

### SHADCN INTEGRATION REQUIREMENTS
1. Design APIs for shadcn component data structures
2. WebSocket support for real-time component updates
3. File upload handling for image/video components
4. Authentication middleware for protected routes

### API DESIGN PATTERNS
```
COMPONENT-FRIENDLY ENDPOINTS:
GET /api/prospects -> DataTable format
GET /api/position -> Badge/Card format  
GET /api/analytics -> Chart format
POST /api/prospects -> Form submission format
WebSocket /live -> Real-time component updates
```

### RECRUITMENT BACKEND ARCHITECTURE
```
CONTROLLERS:
- AuthController (login/signup flows)
- ProspectController (CRM operations)
- PositionController (recruitment queue management)
- AdminController (system management)
- RealtimeController (WebSocket events)

MODELS:
- User (authentication, roles)
- Prospect (CRM data)
- Position (recruitment queue)
- Commission (earnings tracking)
- Activity (audit trail)

MIDDLEWARE:
- Authentication (JWT validation)
- Authorization (role-based access)
- RateLimit (API protection)
- CORS (frontend integration)
- Logging (audit trail)
```

### INTEGRATION STANDARDS
- RESTful APIs with consistent JSON structure
- WebSocket events for live updates
- File handling for video/image uploads
- Comprehensive error handling
- Security-first approach