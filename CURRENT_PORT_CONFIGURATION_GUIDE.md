# Current Port Configuration Guide

## Understanding Your Project's Port Setup

Your project uses a **multi-service architecture** where different components run on different ports. Here's the complete breakdown:

## 🖥️ Port Configuration Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Local Machine                      │
├─────────────────────────────────────────────────────────────┤
│  Port 3000: Frontend (React/Vite Development Server)       │
│  └─ URL: http://localhost:3000                             │
│  └─ Purpose: Your React application UI                     │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Services                          │
├─────────────────────────────────────────────────────────────┤
│  Port 8001: BHIV Core Service                              │
│  └─ URL: http://localhost:8001                             │
│  └─ Purpose: Main backend API, tag management              │
│                                                             │
│  Port 8002: BHIV MCP Bridge                                │
│  └─ URL: http://localhost:8002                             │
│  └─ Purpose: Task orchestration, multi-modal processing    │
│                                                             │
│  Port 8003: Insight Bridge Component                       │
│  └─ URL: http://localhost:8003                             │
│  └─ Purpose: Security, JWT tokens, audit trails           │
└─────────────────────────────────────────────────────────────┘
```

## 📍 What Each Port Does

### Port 3000 - Frontend (Your React App)
**This is your user interface!**
- **What runs here**: React application with Vite development server
- **What you see**: The moderation dashboard, tag panels, analytics
- **When it's active**: When you run `npm run dev` in your frontend directory
- **How to access**: Open browser to `http://localhost:3000`

### Port 8001 - BHIV Core Service
**This is your main backend API!**
- **What runs here**: BHIV Core API server
- **What it does**: 
  - Tag lifecycle management
  - Content moderation
  - Analytics data
  - Knowledge base queries
  - NLP context processing
- **When it's active**: When the BHIV Core service is running
- **How to access**: `http://localhost:8001/health`

### Port 8002 - BHIV MCP Bridge
**This handles advanced processing!**
- **What runs here**: BHIV MCP Bridge service
- **What it does**: 
  - Task orchestration
  - Multi-modal processing
  - Agent registry
  - Reinforcement learning
- **When it's active**: When the MCP Bridge service is running
- **How to access**: `http://localhost:8002/health`

### Port 8003 - Insight Bridge Component
**This handles security and real-time features!**
- **What runs here**: Insight Bridge Security API
- **What it does**: 
  - JWT token creation and verification
  - Message signing and verification
  - Audit trail logging
  - Real-time insights
- **When it's active**: When the Insight Bridge service is running
- **How to access**: `http://localhost:8003/health`

## 🔍 Current Status Check

### Check what's currently running:

```bash
# Check if frontend is running on port 3000
curl http://localhost:3000

# Check if BHIV Core is running on port 8001
curl http://localhost:8001/health

# Check if MCP Bridge is running on port 8002
curl http://localhost:8002/health

# Check if Insight Bridge is running on port 8003
curl http://localhost:8003/health
```

### Alternative: Check with netstat or lsof

```bash
# On Windows
netstat -an | findstr :3000
netstat -an | findstr :8001
netstat -an | findstr :8002
netstat -an | findstr :8003

# On macOS/Linux
lsof -i :3000
lsof -i :8001
lsof -i :8002
lsof -i :8003
```

## 🚀 Starting the Services

### 1. Start Frontend (Port 3000)
```bash
# In your frontend directory
npm install
npm run dev
```
**Result**: Your React app runs on `http://localhost:3000`

### 2. Start Backend Services
The backend services need to be started separately:

```bash
# Terminal 1: BHIV Core Service (Port 8001)
# Assuming you have the BHIV repository cloned
cd v1-BHIV_CORE
python simple_api.py --port 8001

# Terminal 2: BHIV MCP Bridge (Port 8002) - Optional
python mcp_bridge.py

# Terminal 3: Insight Bridge (Port 8003)
# Assuming you have the Insight Bridge repository
cd insightbridge-phase3
python -m src.receiver.receiver
```

### 3. Using Docker (Alternative)
If you have Docker Compose set up:
```bash
# Start all services at once
docker-compose up --build
```

## 📊 Service Dependencies

**The frontend (port 3000) depends on the backend services:**

```
Frontend (3000) → Calls → BHIV Core (8001)
Frontend (3000) → Calls → Insight Bridge (8003)
```

**Typical flow:**
1. User opens `http://localhost:3000` (frontend loads)
2. Frontend makes API calls to `http://localhost:8001` (BHIV Core)
3. Frontend makes security calls to `http://localhost:8003` (Insight Bridge)
4. Backend services process requests and return data
5. Frontend displays the results

## ⚠️ Common Issues

### "Cannot connect to backend"
- **Problem**: Backend services are not running
- **Solution**: Start BHIV Core (8001) and Insight Bridge (8003) services

### "Port 3000 already in use"
- **Problem**: Another process is using port 3000
- **Solution**: 
  - Change the port in `vite.config.ts`
  - Or stop the other process using port 3000

### "Backend services unreachable"
- **Problem**: Backend services are not accessible
- **Solution**: 
  - Check if services are running
  - Verify firewall settings
  - Check environment variables

## 🎯 Quick Test

**Test your complete setup:**

1. **Start frontend**: `npm run dev` → Should open `http://localhost:3000`
2. **Check backend health**: Visit `http://localhost:8001/health` in browser
3. **Test API call**: Frontend should successfully load data from backend
4. **Check browser console**: Should show successful API responses

## 📝 Environment Configuration

Your `.env.bhiv` file shows the correct configuration:
- Frontend knows to call backend on port 8001
- Frontend knows to call Insight Bridge on port 8003
- All services are properly configured to communicate

## 💡 Summary

- **Port 3000**: Your React frontend (what you see and interact with)
- **Port 8001**: Main backend API (BHIV Core)
- **Port 8002**: Advanced processing (BHIV MCP Bridge) 
- **Port 8003**: Security & real-time (Insight Bridge)

**The frontend on port 3000 calls the backend services on ports 8001, 8002, and 8003 to get data and functionality.**
