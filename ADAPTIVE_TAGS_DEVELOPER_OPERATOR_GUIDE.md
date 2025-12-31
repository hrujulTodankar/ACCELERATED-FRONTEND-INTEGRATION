# Adaptive Tags Integration - Developer & Operator Guide

## Quick Start Guide

### System Overview

The Adaptive Tags system integrates three core components:

1. **BHIV Core Service** (Port 8001) - Business logic and tag lifecycle management
2. **Insight Bridge Component** (Port 8003) - Real-time insights and security
3. **Frontend Application** (Port 3000) - User interface and interaction layer

### Development Environment Setup

```bash
# Clone and setup
git clone <repository-url>
cd adaptive-tags-integration

# Start all services
docker-compose up --build

# Frontend development
cd frontend && npm install && npm run dev

# Backend development
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
```

### Environment Configuration

```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_ENVIRONMENT=development

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/adaptive_tags
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=dev-secret-key
BHIV_CORE_URL=http://localhost:8001
INSIGHT_BRIDGE_URL=http://localhost:8003
```

## API Reference

### Core Endpoints

#### Create Tag
```http
POST /api/v1/tags
Authorization: Bearer <jwt_token>

{
  "content_id": "content_123",
  "content": "This is sample content",
  "type": "auto",
  "metadata": {
    "source": "user_input"
  }
}
```

#### Get Tags
```http
GET /api/v1/tags?content_id=content_123&status=active
Authorization: Bearer <jwt_token>
```

#### Update Tag
```http
PUT /api/v1/tags/tag_456
Authorization: Bearer <jwt_token>

{
  "action": "update",
  "updates": {
    "confidence": 0.95,
    "user_feedback": "positive"
  }
}
```

### WebSocket Events

#### Subscribe to Updates
```javascript
const ws = new WebSocket('ws://localhost:8000/v1/tags/stream');
ws.send(JSON.stringify({
  type: 'subscribe',
  content_id: 'content_123',
  user_id: 'user_456'
}));
```

#### Receive Updates
```javascript
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  switch (update.event) {
    case 'tag_created':
      // Handle new tag
      break;
    case 'tag_updated':
      // Handle tag update
      break;
    case 'tag_deleted':
      // Handle tag deletion
      break;
  }
};
```

## Frontend Integration

### Using the Adaptive Tags Hook

```typescript
import { useAdaptiveTags } from './hooks/useAdaptiveTags';

const TagManagementComponent = ({ contentId }) => {
  const {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    searchTags,
    applyFilters
  } = useAdaptiveTags(contentId);

  const handleCreateTag = async (tagData) => {
    try {
      const newTag = await createTag({
        label: 'machine learning',
        category: 'topic',
        source: 'user'
      });
      console.log('Tag created:', newTag);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <div>
      {/* Tag management UI */}
    </div>
  );
};
```

### Custom Tag Components

```typescript
import { TagCard } from './components/TagCard';

const CustomTagGrid = ({ tags, onTagSelect }) => {
  return (
    <div className="tag-grid">
      {tags.map(tag => (
        <TagCard
          key={tag.tag_id}
          tag={tag}
          selected={false}
          onClick={() => onTagSelect(tag)}
          onAction={(action) => handleTagAction(tag, action)}
        />
      ))}
    </div>
  );
};
```

## Backend Integration

### Python FastAPI Integration

```python
from fastapi import FastAPI, Depends
from adaptive_tags import TagService

app = FastAPI()
tag_service = TagService()

@app.post("/api/v1/tags")
async def create_tag(
    request: CreateTagRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        tag = await tag_service.create_tag(request, current_user)
        return {"success": True, "data": tag}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Node.js Integration

```javascript
const { TagService } = require('./services/tagService');

const tagService = new TagService();

async function createTag(req, res) {
  try {
    const tag = await tagService.createTag(req.body, req.user);
    res.json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Monitoring & Observability

### Health Check Endpoints

```bash
# Overall system health
curl http://localhost:8000/health

# Individual service health
curl http://localhost:8001/health  # BHIV Core
curl http://localhost:8003/health  # Insight Bridge
```

### Metrics & Logging

#### Key Metrics to Monitor
- API response times (should be < 200ms)
- WebSocket connection count
- Tag creation/update rates
- Error rates by endpoint
- Cache hit rates
- Database query performance

#### Log Levels
```javascript
// Development
LOG_LEVEL=debug

// Production
LOG_LEVEL=error
```

### Grafana Dashboards

Key dashboards to set up:
1. **API Performance**: Response times, throughput, errors
2. **WebSocket Monitoring**: Connection counts, message rates
3. **Database Performance**: Query times, connection pool
4. **Cache Performance**: Hit rates, memory usage
5. **Business Metrics**: Tag creation rates, user engagement

## Troubleshooting Guide

### Common Issues

#### 1. Tag Creation Fails
**Symptoms**: API returns 500 error  
**Diagnosis**:
```bash
# Check service health
curl http://localhost:8000/health

# Check logs
docker-compose logs backend

# Check database connectivity
psql -h localhost -U user -d adaptive_tags
```

**Solutions**:
- Verify all services are running
- Check database connection string
- Review error logs for specific issues
- Ensure sufficient disk space

#### 2. WebSocket Connection Issues
**Symptoms**: Real-time updates not working  
**Diagnosis**:
```javascript
// Check browser console for WebSocket errors
// Verify WebSocket endpoint accessibility
const ws = new WebSocket('ws://localhost:8000/v1/tags/stream');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

**Solutions**:
- Check firewall settings
- Verify WebSocket endpoint is accessible
- Review WebSocket configuration
- Check load balancer WebSocket support

#### 3. Performance Issues
**Symptoms**: Slow response times, UI lag  
**Diagnosis**:
```bash
# Check resource usage
docker stats

# Check database performance
psql -c "SELECT * FROM pg_stat_activity;"

# Check cache performance
redis-cli info stats
```

**Solutions**:
- Scale horizontally if needed
- Optimize database queries
- Increase cache memory
- Review and optimize API endpoints

#### 4. Authentication Errors
**Symptoms**: 401/403 errors on API calls  
**Diagnosis**:
```bash
# Test token validation
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/tags

# Check JWT secret configuration
echo $JWT_SECRET_KEY
```

**Solutions**:
- Verify JWT secret is correctly configured
- Check token expiration times
- Review authentication middleware
- Ensure proper token refresh logic

### Debug Mode

#### Enable Debug Logging
```bash
# Backend
export LOG_LEVEL=debug
export DEBUG=true

# Frontend
localStorage.setItem('debug', 'adaptive-tags:*');
```

#### Database Debugging
```sql
-- Enable query logging
SHOW log_statement;
SHOW log_min_duration_statement;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Redis Debugging
```bash
# Monitor Redis commands
redis-cli monitor

# Check memory usage
redis-cli info memory

# Check key statistics
redis-cli info keyspace
```

## Performance Optimization

### Caching Strategy

#### Frontend Caching
```typescript
// Cache tag data for 5 minutes
const tagCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCachedTags = (contentId: string) => {
  const cached = tagCache.get(contentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};
```

#### Backend Caching
```python
# Redis caching for tag data
import redis
import json
from datetime import timedelta

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_tag_data(tag_id: str, data: dict, ttl: int = 300):
    redis_client.setex(
        f"tag:{tag_id}", 
        timedelta(seconds=ttl), 
        json.dumps(data)
    )

def get_cached_tag_data(tag_id: str):
    cached = redis_client.get(f"tag:{tag_id}")
    return json.loads(cached) if cached else None
```

### Database Optimization

#### Query Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_tags_content_id ON tags(content_id);
CREATE INDEX idx_tags_status ON tags(status);
CREATE INDEX idx_tags_created_at ON tags(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tags WHERE content_id = 'content_123';
```

#### Connection Pooling
```python
# Database connection pool
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### Frontend Optimization

#### Component Optimization
```typescript
// Memoize expensive components
const TagAnalyticsPanel = React.memo(({ tag }) => {
  const analytics = useMemo(() => 
    calculateAnalytics(tag), [tag.id]
  );
  
  return (
    <div>
      {/* Analytics display */}
    </div>
  );
});

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const TagList = ({ tags }) => (
  <List
    height={600}
    itemCount={tags.length}
    itemSize={80}
  >
    {({ index, style }) => (
      <div style={style}>
        <TagCard tag={tags[index]} />
      </div>
    )}
  </List>
);
```

## Security Best Practices

### API Security

#### Rate Limiting
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/tags")
@limiter.limit("10/minute")
async def create_tag(request: Request, ...):
    # Endpoint logic
    pass
```

#### Input Validation
```python
from pydantic import BaseModel, validator

class CreateTagRequest(BaseModel):
    content_id: str
    content: str
    type: str
    
    @validator('content')
    def validate_content(cls, v):
        if len(v) > 10000:
            raise ValueError('Content too long')
        return v
```

### Frontend Security

#### XSS Prevention
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeContent = (content: string) => {
  return DOMPurify.sanitize(content);
};

// Use React's built-in XSS protection
const TagDisplay = ({ content }) => {
  // React automatically escapes content
  return <div>{content}</div>;
};
```

#### CSRF Protection
```typescript
// Include CSRF token in requests
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-CSRF-Token': getCsrfToken()
  }
});
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests pass (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

### Deployment Steps
1. **Backup Current System**
   ```bash
   # Backup database
   pg_dump adaptive_tags > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Backup Redis data
   redis-cli --rdb backup_$(date +%Y%m%d_%H%M%S).rdb
   ```

2. **Deploy Services**
   ```bash
   # Deploy backend services
   kubectl apply -f k8s/backend/
   
   # Deploy frontend
   kubectl apply -f k8s/frontend/
   
   # Update DNS records
   # Configure load balancer
   ```

3. **Verify Deployment**
   ```bash
   # Health checks
   curl https://api.adaptive-tags.com/health
   
   # Smoke tests
   npm run test:smoke
   
   # Performance tests
   npm run test:performance
   ```

4. **Monitor Rollout**
   - Watch Grafana dashboards
   - Monitor error rates
   - Check response times
   - Verify user functionality

### Rollback Plan
```bash
# Quick rollback
kubectl rollout undo deployment/adaptive-tags-backend
kubectl rollout undo deployment/adaptive-tags-frontend

# Database rollback
psql adaptive_tags < backup_$(date +%Y%m%d_%H%M%S).sql

# Redis rollback
redis-cli --rdb backup_$(date +%Y%m%d_%H%M%S).rdb
```

## Support Contacts

### Development Team
- **Technical Lead**: tech-lead@company.com
- **Frontend Lead**: frontend-lead@company.com
- **Backend Lead**: backend-lead@company.com
- **DevOps Lead**: devops-lead@company.com

### On-call Support
- **Primary**: oncall-primary@company.com
- **Secondary**: oncall-secondary@company.com
- **Escalation**: oncall-escalation@company.com

### External Support
- **Infrastructure**: infrastructure@company.com
- **Security**: security@company.com
- **Database**: dba@company.com

## Additional Resources

### Documentation
- [Main Specification](./ADAPTIVE_TAGS_COMPREHENSIVE_INTEGRATION_SPECIFICATION.md)
- [Flow Diagrams](./ADAPTIVE_TAGS_FLOW_DIAGRAMS.md)
- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)

### Tools & Utilities
- [Local Development Setup](./scripts/setup-dev.sh)
- [Database Migration Tool](./scripts/migrate.sh)
- [Performance Testing](./scripts/performance-test.sh)
- [Monitoring Setup](./scripts/setup-monitoring.sh)

### Training Materials
- [Video Tutorials](./training/videos/)
- [Interactive Demos](./training/demos/)
- [Best Practices Guide](./training/best-practices.md)
- [Architecture Deep Dive](./training/architecture.md)

This guide provides developers and operators with everything needed to successfully implement, deploy, and maintain the Adaptive Tags integration system.
