# BHIV Analytics Backend Integration Guide

## Overview

This guide explains how the frontend analytics service integrates with Ashmit's BHIV (Backend for High-Intensity Vector) analytics backend. The integration provides comprehensive analytics, NLP context, and content tagging capabilities.

## Architecture

### BHIV Backend Components

1. **Simple API** (Port 8001) - Main API endpoint
   - Knowledge base queries
   - Analytics data
   - Agent routing
   - Health monitoring

2. **MCP Bridge** (Port 8002) - Task orchestration
   - Multi-modal processing
   - Agent registry
   - Reinforcement learning

3. **Web Interface** (Port 8003) - Monitoring dashboard
   - Task monitoring
   - NLO downloads
   - System status

### Frontend Integration Points

The frontend connects to BHIV through these services:

- **Analytics Service** (`src/services/apiService.ts`)
- **Moderation Store** (`src/store/moderationStore.tsx`)
- **Analytics Panel** (`src/components/AnalyticsPanel.tsx`)

## Configuration

### Environment Variables

Copy `.env.bhiv` to `.env` and configure:

```env
# BHIV API Configuration
VITE_BHIV_API_URL=http://localhost:8001
VITE_API_BASE_URL=http://localhost:8001

# Feature Flags
VITE_USE_BHIV_ANALYTICS=true
VITE_USE_BHIV_NLP=true
VITE_USE_BHIV_TAGS=true
VITE_ENABLE_BHIV_FALLBACK=true

# Development
VITE_DEV_MODE=true
VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true
```

### BHIV Backend Setup

1. **Clone Ashmit's repository:**
   ```bash
   git clone https://github.com/sharmavijay45/v1-BHIV_CORE.git
   cd v1-BHIV_CORE
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start BHIV services:**
   ```bash
   # Terminal 1: Simple API
   python simple_api.py --port 8001
   
   # Terminal 2: MCP Bridge (optional)
   python mcp_bridge.py
   
   # Terminal 3: Web Interface (optional)
   python integration/web_interface.py
   ```

## API Endpoints Integration

### Analytics Integration

**Endpoint:** `GET /kb-analytics`

**Purpose:** Get system-wide analytics from BHIV backend

**Frontend Usage:**
```typescript
const analytics = await getAnalytics(contentId);
// Returns AnalyticsResponse with transformed BHIV data
```

**Data Transformation:**
- BHIV analytics → Frontend format
- System metrics → Per-item view
- Success rates → CTR calculations

### NLP Context Integration

**Endpoint:** `POST /query-kb`

**Purpose:** Generate NLP context using BHIV knowledge base

**Frontend Usage:**
```typescript
const nlpContext = await getNLPContext(contentId);
// Returns NLPResponse with BHIV-enhanced data
```

**Features:**
- Topic extraction
- Sentiment analysis
- Entity recognition
- Context generation

### Tag Generation Integration

**Endpoint:** `POST /query-kb`

**Purpose:** Generate content tags using BHIV agents

**Frontend Usage:**
```typescript
const tags = await getTags(contentId);
// Returns TagResponse with BHIV-generated tags
```

## Error Handling & Fallbacks

### Development Mode Fallbacks

When BHIV backend is unavailable in development:

1. **Analytics:** Mock analytics data with realistic trends
2. **NLP Context:** Simulated sentiment and topic analysis
3. **Tags:** Generated mock tags with confidence scores

### Production Considerations

For production deployment:

1. **Health Checks:** Monitor BHIV service availability
2. **Circuit Breakers:** Implement retry logic with exponential backoff
3. **Caching:** Cache analytics data to reduce API calls
4. **Monitoring:** Track integration health and performance

## Data Flow

### Analytics Data Flow

```
Frontend Request → BHIV Simple API → KB Analytics → Data Transformation → Frontend Display
```

**Transformation Process:**
1. BHIV returns system-wide metrics
2. Transform to per-item analytics view
3. Generate trend data based on system performance
4. Calculate CTR from success rates

### NLP Context Flow

```
Frontend Request → BHIV Knowledge Base → Agent Processing → Context Enhancement → Frontend Display
```

**Processing Steps:**
1. Query BHIV knowledge base for content analysis
2. Extract topics and sentiment from response
3. Generate entities and context
4. Format for frontend consumption

### Tag Generation Flow

```
Frontend Request → BHIV Agent Registry → Knowledge Agent → Tag Extraction → Frontend Display
```

**Generation Process:**
1. Route to appropriate BHIV agent
2. Process content through knowledge base
3. Extract relevant tags with confidence
4. Return formatted tag data

## Monitoring & Debugging

### Health Check

Test BHIV integration health:

```bash
curl http://localhost:8001/health
```

### Debug Mode

Enable detailed logging in development:

```typescript
// In apiService.ts
const DEBUG_BHIV = true;
```

### Integration Testing

Run integration tests:

```bash
npm run test:integration
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check BHIV services are running
   - Verify port numbers match configuration
   - Check firewall settings

2. **Authentication Errors**
   - Verify API keys if required
   - Check CORS settings in BHIV backend

3. **Data Format Errors**
   - Check data transformation logic
   - Verify API response format matches expectations

4. **Performance Issues**
   - Monitor API response times
   - Implement caching for frequently accessed data
   - Consider rate limiting

### Debug Steps

1. **Check BHIV Status:**
   ```bash
   curl http://localhost:8001/health
   curl http://localhost:8002/health
   ```

2. **Test Individual Endpoints:**
   ```bash
   curl -X POST http://localhost:8001/query-kb \
     -H "Content-Type: application/json" \
     -d '{"query": "test", "limit": 1}'
   ```

3. **Check Frontend Logs:**
   - Browser developer console
   - Network tab for API calls
   - Redux DevTools for state management

## Security Considerations

### API Security

1. **Authentication:** Implement proper auth tokens
2. **CORS:** Configure appropriate origins
3. **Rate Limiting:** Prevent abuse of BHIV services
4. **Input Validation:** Sanitize all requests

### Data Privacy

1. **Data Encryption:** Use HTTPS in production
2. **PII Handling:** Avoid sending sensitive data to BHIV
3. **Logging:** Monitor for data leaks in logs

## Performance Optimization

### Caching Strategy

```typescript
// Cache analytics data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedAnalytics = async (id: string) => {
  const cached = cache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await getAnalytics(id);
  cache.set(id, { data, timestamp: Date.now() });
  return data;
};
```

### Batch Processing

For multiple content items:

```typescript
const batchGetAnalytics = async (ids: string[]) => {
  const promises = ids.map(id => getAnalytics(id));
  return Promise.allSettled(promises);
};
```

## Future Enhancements

### Planned Features

1. **Real-time Analytics:** WebSocket connections for live updates
2. **Advanced NLP:** Sentiment trends, entity relationships
3. **Custom Agents:** Domain-specific BHIV agents
4. **Performance Metrics:** Detailed integration monitoring

### Extension Points

1. **Custom Transforms:** Add new data transformation functions
2. **Additional Endpoints:** Integrate more BHIV services
3. **Plugin System:** Extensible analytics plugins
4. **Export Features:** Analytics data export capabilities

## Support

For issues with BHIV integration:

1. Check this documentation
2. Review BHIV backend logs
3. Test individual endpoints
4. Contact Ashmit for BHIV-specific issues

## Summary

The BHIV integration provides a robust analytics backend with:

- ✅ **Analytics Integration** - System-wide metrics transformed to per-item views
- ✅ **NLP Context** - Knowledge base-powered content analysis
- ✅ **Tag Generation** - AI-generated content tags
- ✅ **Error Handling** - Graceful fallbacks and recovery
- ✅ **Development Support** - Mock data and debugging tools
- ✅ **Production Ready** - Health checks and monitoring

The integration is designed to be resilient, performant, and developer-friendly while providing powerful analytics capabilities through Ashmit's BHIV backend.