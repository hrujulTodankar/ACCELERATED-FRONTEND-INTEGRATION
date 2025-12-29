# BHIV Core API Integration Guide

## Overview

The BHIV Core API provides comprehensive backend services for the frontend application, including spiritual wisdom (Vedas), educational content (Edumentor), wellness guidance, and advanced knowledge base operations. This integration enables the frontend to access all BHIV Core functionalities seamlessly.

## Features

### 🕉️ Spiritual Wisdom (Vedas)
- **Ancient Wisdom**: Get guidance based on Vedic texts and philosophy
- **Spiritual Queries**: Ask questions about dharma, moksha, karma, and spiritual practices
- **Both GET and POST**: Flexible query methods for different use cases

### 🎓 Educational Content (Edumentor)
- **Learning Assistance**: Get clear explanations on various topics
- **Academic Support**: Help with complex subjects and concepts
- **Student-Friendly**: Designed for educational scenarios

### 🌿 Wellness Guidance
- **Health Advice**: Guidance on physical and mental wellbeing
- **Lifestyle Tips**: Practical advice for healthy living
- **Stress Management**: Support for mental health and stress reduction

### 📚 Advanced Knowledge Base
- **Multi-Source Search**: Query across multiple knowledge sources
- **NAS Integration**: Access to Network Attached Storage knowledge base
- **Document Management**: List, search, and retrieve specific documents
- **Analytics**: Track usage and performance metrics

### 📊 Analytics & Feedback
- **Usage Analytics**: Track query patterns and system performance
- **Feedback System**: Collect and process user feedback
- **Performance Monitoring**: Monitor response times and success rates

## API Endpoints

### Base Configuration
```javascript
// Default configuration in apiService.ts
const resolvedBaseURL = process.env.BHIV_BASE_URL || 'http://localhost:8001';
```

### Core Endpoints

#### Health & Status
```javascript
// Health check with detailed status
GET /health

// Simple service information
GET /
```

#### Spiritual Wisdom (Vedas)
```javascript
// POST method for Vedas queries
POST /ask-vedas
{
  "query": "string",
  "user_id": "string (optional)"
}

// GET method for Vedas queries
GET /ask-vedas?query=string&user_id=string
```

#### Educational Content (Edumentor)
```javascript
// POST method for educational queries
POST /edumentor
{
  "query": "string",
  "user_id": "string (optional)"
}

// GET method for educational queries
GET /edumentor?query=string&user_id=string
```

#### Wellness Guidance
```javascript
// POST method for wellness queries
POST /wellness
{
  "query": "string",
  "user_id": "string (optional)"
}

// GET method for wellness queries
GET /wellness?query=string&user_id=string
```

#### Knowledge Base Operations
```javascript
// Query knowledge base via POST
POST /query-kb
{
  "query": "string",
  "limit": "number (optional, default: 5)",
  "user_id": "string (optional)",
  "filters": "object (optional)"
}

// Query knowledge base via GET
GET /query-kb?query=string&limit=number&user_id=string
```

#### NAS Knowledge Base
```javascript
// Get NAS KB status and statistics
GET /nas-kb/status

// List all documents in NAS KB
GET /nas-kb/documents

// Search NAS KB
GET /nas-kb/search?query=string&limit=number

// Get specific document content
GET /nas-kb/document/{document_id}
```

#### Analytics & Feedback
```javascript
// Get analytics data
GET /kb-analytics?hours=number

// Submit feedback
POST /kb-feedback
{
  "query_id": "string",
  "feedback": {
    "rating": "number",
    "comment": "string",
    "helpful": "boolean"
  }
}
```

## Frontend Integration

### Import the Service Functions
```typescript
import {
  // Core endpoint functions
  askVedas,
  askVedasGet,
  askEdumentor,
  askEdumentorGet,
  askWellness,
  askWellnessGet,
  
  // Knowledge base functions
  queryKnowledgeBase,
  queryKnowledgeBaseGet,
  
  // NAS KB functions
  getNasKBStatus,
  listNasKBDocuments,
  searchNasKB,
  getNasKBDocument,
  
  // Analytics and feedback
  getKBAnalytics,
  submitKBFeedback,
  
  // Health checks
  checkBHIVCoreHealth,
  
  // Combined operations
  performBHIVOperation
} from '../services/apiService';
```

### Basic Usage Examples

#### 1. Spiritual Wisdom Query
```typescript
try {
  const response = await askVedas({
    query: "What is the meaning of dharma in daily life?",
    user_id: "user123"
  });
  
  console.log("Spiritual guidance:", response.response);
  console.log("Sources:", response.sources);
} catch (error) {
  console.error("Vedas query failed:", error);
}
```

#### 2. Educational Content Request
```typescript
try {
  // Using GET method
  const response = await askEdumentorGet(
    "Explain quantum physics basics for beginners",
    "student456"
  );
  
  console.log("Educational content:", response.response);
} catch (error) {
  console.error("Educational query failed:", error);
}
```

#### 3. Wellness Guidance
```typescript
try {
  const response = await askWellness({
    query: "How can I reduce stress during busy work days?",
    user_id: "user789"
  });
  
  console.log("Wellness advice:", response.response);
} catch (error) {
  console.error("Wellness query failed:", error);
}
```

#### 4. Knowledge Base Query
```typescript
try {
  const response = await queryKnowledgeBase({
    query: "Ancient wisdom and modern science",
    limit: 3,
    user_id: "researcher"
  });
  
  console.log("KB Response:", response.response);
  console.log("Sources found:", response.sources.length);
} catch (error) {
  console.error("KB query failed:", error);
}
```

#### 5. NAS Knowledge Base Operations
```typescript
try {
  // Get system status
  const status = await getNasKBStatus();
  console.log("NAS KB Status:", status.status);
  
  // List documents
  const documents = await listNasKBDocuments();
  console.log("Available documents:", documents.count);
  
  // Search documents
  const searchResults = await searchNasKB("vedic philosophy", 5);
  console.log("Search results:", searchResults.count);
  
} catch (error) {
  console.error("NAS KB operation failed:", error);
}
```

#### 6. Analytics and Feedback
```typescript
try {
  // Get analytics for last 24 hours
  const analytics = await getKBAnalytics(24);
  console.log("Total queries:", analytics.analytics.total_queries);
  console.log("Success rate:", analytics.analytics.success_rate);
  
  // Submit feedback
  const feedback = await submitKBFeedback({
    query_id: "query_123",
    feedback: {
      rating: 5,
      comment: "Very helpful response!",
      helpful: true
    }
  });
  
  console.log("Feedback submitted:", feedback.message);
} catch (error) {
  console.error("Analytics/Feedback failed:", error);
}
```

#### 7. Combined Operations
```typescript
try {
  const result = await performBHIVOperation(
    'vedas',
    { 
      query: "What is the path to enlightenment?", 
      user_id: "seeker" 
    },
    {
      includeSources: true,
      fallback: true
    }
  );
  
  if (result.success) {
    console.log("Combined operation result:", result.data);
    console.log("Sources:", result.sources);
    console.log("Endpoint used:", result.endpoint);
  }
} catch (error) {
  console.error("Combined operation failed:", error);
}
```

## Environment Configuration

### Required Environment Variables
```bash
# BHIV Core Service URL
VITE_API_BASE_URL=http://localhost:8001
BHIV_BASE_URL=http://localhost:8001

# Feature Flags
VITE_USE_BHIV_ANALYTICS=true
VITE_USE_BHIV_NLP=true
VITE_USE_BHIV_TAGS=true
VITE_ENABLE_BHIV_FALLBACK=true

# Timeouts
VITE_BHIV_TIMEOUT=10000
VITE_BHIV_ANALYTICS_TIMEOUT=5000
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8001` | BHIV Core API base URL |
| `VITE_USE_BHIV_ANALYTICS` | `true` | Enable BHIV analytics features |
| `VITE_USE_BHIV_NLP` | `true` | Enable NLP processing features |
| `VITE_USE_BHIV_TAGS` | `true` | Enable content tagging features |
| `VITE_ENABLE_BHIV_FALLBACK` | `true` | Enable fallback mechanisms |
| `VITE_BHIV_TIMEOUT` | `10000` | Request timeout in milliseconds |
| `VITE_BHIV_ANALYTICS_TIMEOUT` | `5000` | Analytics timeout in milliseconds |

## Error Handling

### Common Error Patterns

#### 1. Connection Errors
```typescript
try {
  const response = await askVedas({ query: "test" });
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.log('BHIV Core service is not running');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('Request timed out');
  }
}
```

#### 2. Validation Errors
```typescript
try {
  const response = await queryKnowledgeBase({
    query: "", // Empty query
    limit: -1  // Invalid limit
  });
} catch (error) {
  if (error.response?.status === 400) {
    console.log('Invalid request parameters');
  }
}
```

#### 3. Service Unavailable
```typescript
// Using fallback mechanism
const result = await performBHIVOperation(
  'vedas',
  { query: "test" },
  { fallback: true } // This will provide fallback response
);
```

## Advanced Features

### 1. Request Batching
```typescript
// Batch multiple queries
const batchQueries = [
  () => askVedas({ query: "What is dharma?" }),
  () => askEdumentor({ query: "Explain gravity" }),
  () => askWellness({ query: "How to sleep better?" })
];

const results = await Promise.allSettled(batchQueries.map(fn => fn()));
```

### 2. Response Caching
```typescript
const cache = new Map();

async function getCachedVedasResponse(query: string) {
  const cacheKey = `vedas_${query}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await askVedas({ query });
  cache.set(cacheKey, response);
  return response;
}
```

### 3. Request Queuing
```typescript
class BHIVRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }
    this.processing = false;
  }
}
```

## Testing

### Running Integration Tests
```bash
# Test BHIV Core API integration
node test_bhivcore_integration.js

# Set custom API URL
BHIVCORE_API_URL=http://localhost:8001 node test_bhivcore_integration.js
```

### Test Coverage
The test script validates:
- ✅ Health check endpoints
- ✅ All core endpoints (Vedas, Edumentor, Wellness)
- ✅ Knowledge base operations (GET and POST)
- ✅ NAS KB operations (if available)
- ✅ Analytics and feedback endpoints
- ✅ Combined operations
- ✅ Error handling and fallbacks

## Performance Optimization

### 1. Connection Pooling
The axios instance is configured with connection pooling for optimal performance.

### 2. Request Timeouts
Proper timeout configurations prevent hanging requests:
- General requests: 10 seconds
- Analytics requests: 5 seconds

### 3. Response Caching
Implement caching for frequently accessed content:
```typescript
// Cache knowledge base results
const kbCache = new Map();

async function getCachedKBResponse(query: string) {
  const cacheKey = `kb_${query}`;
  if (kbCache.has(cacheKey)) {
    return kbCache.get(cacheKey);
  }
  
  const response = await queryKnowledgeBase({ query });
  kbCache.set(cacheKey, response);
  return response;
}
```

### 4. Batch Processing
For multiple queries, use batch processing:
```typescript
const queries = ["query1", "query2", "query3"];
const results = await Promise.all(
  queries.map(query => askVedas({ query }))
);
```

## Troubleshooting

### Common Issues

#### 1. Service Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:8001
```
**Solution**: Ensure BHIV Core service is running on port 8001.

#### 2. Timeout Errors
```
Error: timeout of 10000ms exceeded
```
**Solution**: Check network connectivity and increase timeout values.

#### 3. Empty Responses
```typescript
// Enable fallback responses
const result = await performBHIVOperation(
  'vedas',
  { query: "complex question" },
  { fallback: true }
);
```

#### 4. High Latency
```typescript
// Monitor response times
const start = Date.now();
const response = await askVedas({ query: "test" });
const duration = Date.now() - start;
console.log(`Response time: ${duration}ms`);
```

### Debug Mode
Enable detailed logging:
```typescript
// In development environment
localStorage.setItem('BHIV_DEBUG', 'true');
```

## API Response Formats

### Success Response
```json
{
  "query_id": "uuid-string",
  "query": "original query",
  "response": "generated response",
  "sources": [
    {
      "text": "source content",
      "source": "source identifier"
    }
  ],
  "timestamp": "2025-12-29T10:50:00.000Z",
  "endpoint": "ask-vedas",
  "status": 200
}
```

### Error Response
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-12-29T10:50:00.000Z"
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T10:50:00.000Z",
  "services": {
    "search_engine": "healthy",
    "llm_models": "healthy"
  },
  "uptime_seconds": 3600,
  "metrics": {
    "total_requests": 150,
    "successful_requests": 145
  }
}
```

## Security Considerations

### 1. Input Validation
Always validate user inputs:
```typescript
function validateQuery(query: string): boolean {
  return query.trim().length > 0 && query.length < 1000;
}
```

### 2. Rate Limiting
Implement client-side rate limiting:
```typescript
class RateLimiter {
  private requests: number[] = [];
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < 60000);
    return this.requests.length < 10; // Max 10 requests per minute
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
}
```

### 3. Error Information
Don't expose sensitive information in error messages:
```typescript
try {
  const response = await askVedas({ query });
} catch (error) {
  // Log full error internally
  console.error('Detailed error:', error);
  
  // Return generic error to user
  throw new Error('Service temporarily unavailable');
}
```

## Future Enhancements

### Planned Features
- [ ] Streaming responses for long queries
- [ ] Advanced caching strategies
- [ ] Real-time analytics dashboard
- [ ] Multi-language support
- [ ] Enhanced NAS KB integration

### Integration Roadmap
1. **Phase 1**: Core endpoints integration (✅ Complete)
2. **Phase 2**: Advanced KB features (📋 In Progress)
3. **Phase 3**: Real-time capabilities (📋 Planned)
4. **Phase 4**: Enhanced analytics (📋 Planned)

## Support & Maintenance

### Monitoring
- Monitor API response times
- Track success/failure rates
- Set up alerts for service disruptions
- Regular health checks

### Updates
- Keep dependencies updated
- Monitor BHIV Core API changes
- Update integration as needed
- Test thoroughly before deployment

### Getting Help
- Check troubleshooting section above
- Review API documentation at `/docs` endpoint
- Enable debug logging for detailed information
- Contact development team for complex issues

---

**Last Updated**: December 29, 2025  
**Version**: 1.0.0  
**Compatibility**: Frontend API Service v1.0+