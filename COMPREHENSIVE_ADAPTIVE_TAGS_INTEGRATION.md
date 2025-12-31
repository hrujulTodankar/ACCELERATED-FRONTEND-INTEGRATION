# Comprehensive Adaptive Tags Integration Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Data Flow](#data-flow)
4. [API Contracts](#api-contracts)
5. [Authentication & Authorization](#authentication--authorization)
6. [State Management](#state-management)
7. [UI Component Design](#ui-component-design)
8. [Error Handling](#error-handling)
9. [Testing Approach](#testing-approach)
10. [Deployment & CI/CD](#deployment--cicd)
11. [Developer Documentation](#developer-documentation)
12. [Implementation Guide](#implementation-guide)

## Architecture Overview

The Adaptive Tags system consists of three main components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Front-End     │    │   Insight Bridge │    │  BHIV Core      │
│   Application   │    │   Service        │    │  Service        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   Data Storage      │
                    │   & Cache Layer     │
                    └─────────────────────┘
```

### Component Responsibilities

- **BHIV Core Service**: Business logic, data models, tag lifecycle management
- **Insight Bridge**: Real-time analytics and insights for tags
- **Front-End Application**: React SPA for tag rendering and interaction

## System Components

### 1. BHIV Core Service
```typescript
interface Tag {
  id: string;
  name: string;
  type: TagType;
  configuration: TagConfig;
  lifecycle: TagLifecycle;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface TagConfig {
  triggers: TagTrigger[];
  actions: TagAction[];
  conditions: TagCondition[];
  settings: Record<string, any>;
}

enum TagType {
  BEHAVIORAL = 'behavioral',
  ANALYTICAL = 'analytical',
  CONTEXTUAL = 'contextual',
  DYNAMIC = 'dynamic'
}
```

### 2. Insight Bridge Service
```typescript
interface InsightData {
  tagId: string;
  insights: Insight[];
  metrics: TagMetrics;
  recommendations: Recommendation[];
  realTimeData: Record<string, any>;
}

interface Insight {
  type: InsightType;
  confidence: number;
  data: any;
  timestamp: Date;
  source: string;
}
```

### 3. Front-End Application
```typescript
interface AdaptiveTagProps {
  tag: Tag;
  insights: InsightData;
  onInteraction: (interaction: TagInteraction) => void;
  adaptive: boolean;
}
```

## Data Flow

### 1. Tag Creation Flow
```mermaid
sequenceDiagram
    participant FE as Front-End
    participant BHIV as BHIV Core
    participant IB as Insight Bridge
    participant DB as Database

    FE->>BHIV: POST /api/tags
    BHIV->>DB: Save tag configuration
    BHIV->>IB: Initialize tag insights
    IB->>DB: Setup analytics tracking
    BHIV->>FE: Tag created with ID
    IB->>FE: Real-time insights stream
```

### 2. Tag Interaction Flow
```mermaid
sequenceDiagram
    participant U as User
    participant FE as Front-End
    participant BHIV as BHIV Core
    participant IB as Insight Bridge

    U->>FE: Tag interaction
    FE->>BHIV: Log interaction
    BHIV->>IB: Update insights
    IB->>BHIV: Enhanced insights
    BHIV->>FE: Updated tag state
    FE->>U: Adaptive tag update
```

## API Contracts

### BHIV Core API

#### Create Tag
```typescript
// Request
POST /api/v1/tags
{
  "name": "User Behavior Tag",
  "type": "behavioral",
  "configuration": {
    "triggers": [
      {
        "event": "click",
        "selector": ".buy-button",
        "delay": 0
      }
    ],
    "actions": [
      {
        "type": "track",
        "payload": {
          "event": "purchase_intent"
        }
      }
    ],
    "conditions": [
      {
        "operator": "AND",
        "rules": [
          {
            "field": "user_type",
            "operator": "eq",
            "value": "premium"
          }
        ]
      }
    ]
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "tag_123",
    "name": "User Behavior Tag",
    "type": "behavioral",
    "status": "active",
    "createdAt": "2025-12-31T07:55:05.480Z",
    "configuration": { ... }
  }
}
```

#### Get Tag
```typescript
GET /api/v1/tags/{tagId}

// Response
{
  "success": true,
  "data": {
    "id": "tag_123",
    "name": "User Behavior Tag",
    "type": "behavioral",
    "status": "active",
    "lifecycle": {
      "state": "active",
      "version": 1,
      "lastModified": "2025-12-31T07:55:05.480Z"
    },
    "configuration": { ... }
  }
}
```

### Insight Bridge API

#### Real-time Insights
```typescript
// WebSocket Connection
ws://insight-bridge/v1/insights/stream?tagId=tag_123&token={auth_token}

// Message Format
{
  "type": "insight_update",
  "tagId": "tag_123",
  "data": {
    "insights": [
      {
        "type": "behavior_pattern",
        "confidence": 0.85,
        "data": {
          "pattern": "user_prefers_mobile",
          "evidence": ["mobile_clicks", "responsive_layout"]
        }
      }
    ],
    "metrics": {
      "engagement_score": 0.72,
      "conversion_likelihood": 0.45,
      "user_satisfaction": 0.89
    },
    "timestamp": "2025-12-31T07:55:05.480Z"
  }
}
```

#### Batch Insights
```typescript
POST /api/v1/insights/batch
{
  "tagIds": ["tag_123", "tag_456"],
  "metrics": ["engagement", "conversion", "satisfaction"],
  "timeRange": {
    "start": "2025-12-31T00:00:00.000Z",
    "end": "2025-12-31T23:59:59.999Z"
  }
}

// Response
{
  "success": true,
  "data": {
    "tag_123": {
      "insights": [ ... ],
      "metrics": { ... }
    },
    "tag_456": {
      "insights": [ ... ],
      "metrics": { ... }
    }
  }
}
```

## Authentication & Authorization

### JWT Token Structure
```typescript
interface AuthToken {
  sub: string;           // User ID
  aud: string;           // Audience
  exp: number;           // Expiration timestamp
  iat: number;           // Issued at timestamp
  roles: string[];       // User roles
  permissions: string[]; // API permissions
  tagAccess: {
    read: string[];      // Tag IDs user can read
    write: string[];     // Tag IDs user can modify
    admin: string[];     // Tag IDs user can administer
  };
}
```

### Authorization Middleware
```typescript
// Express.js middleware
const authorizeTagAccess = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
      const tagId = req.params.tagId;
      
      if (!decoded.tagAccess[requiredPermission].includes(tagId)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  };
};
```

## State Management

### Front-End State Structure
```typescript
interface AdaptiveTagsState {
  tags: Record<string, Tag>;
  insights: Record<string, InsightData>;
  userInteractions: TagInteraction[];
  subscriptions: WebSocketConnection[];
  loading: {
    tags: boolean;
    insights: boolean;
  };
  errors: {
    tags: Error | null;
    insights: Error | null;
  };
}
```

### Redux/Zustand Store Implementation
```typescript
// Using Zustand for lightweight state management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AdaptiveTagsStore {
  tags: Map<string, Tag>;
  insights: Map<string, InsightData>;
  
  // Actions
  addTag: (tag: Tag) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  updateInsights: (tagId: string, insights: InsightData) => void;
  removeTag: (tagId: string) => void;
}

export const useAdaptiveTagsStore = create<AdaptiveTagsStore>()(
  subscribeWithSelector((set, get) => ({
    tags: new Map(),
    insights: new Map(),
    
    addTag: (tag) => set((state) => {
      const newTags = new Map(state.tags);
      newTags.set(tag.id, tag);
      return { tags: newTags };
    }),
    
    updateTag: (tagId, updates) => set((state) => {
      const newTags = new Map(state.tags);
      const existingTag = newTags.get(tagId);
      if (existingTag) {
        newTags.set(tagId, { ...existingTag, ...updates });
      }
      return { tags: newTags };
    }),
    
    updateInsights: (tagId, insights) => set((state) => {
      const newInsights = new Map(state.insights);
      newInsights.set(tagId, insights);
      return { insights: newInsights };
    }),
    
    removeTag: (tagId) => set((state) => {
      const newTags = new Map(state.tags);
      const newInsights = new Map(state.insights);
      newTags.delete(tagId);
      newInsights.delete(tagId);
      return { tags: newTags, insights: newInsights };
    })
  }))
);
```

## UI Component Design

### Adaptive Tag Component
```typescript
// AdaptiveTag.tsx
import React, { useEffect, useState } from 'react';
import { useAdaptiveTagsStore } from '../store/adaptiveTagsStore';

interface AdaptiveTagProps {
  tagId: string;
  adaptive?: boolean;
  onInteraction?: (interaction: TagInteraction) => void;
}

export const AdaptiveTag: React.FC<AdaptiveTagProps> = ({
  tagId,
  adaptive = true,
  onInteraction
}) => {
  const { tags, insights } = useAdaptiveTagsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tag = tags.get(tagId);
  const tagInsights = insights.get(tagId);

  useEffect(() => {
    if (!tag) {
      loadTag();
    }
  }, [tagId]);

  const loadTag = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTag(tagId);
      useAdaptiveTagsStore.getState().addTag(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInteraction = (interaction: TagInteraction) => {
    onInteraction?.(interaction);
    
    // Send interaction to BHIV Core
    apiService.logInteraction(tagId, interaction);
    
    // Update local state
    // ... (implementation details)
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTag} />;
  }

  if (!tag) {
    return <ErrorState message="Tag not found" />;
  }

  return (
    <div className="adaptive-tag" data-tag-id={tagId}>
      <TagHeader tag={tag} insights={tagInsights} />
      <TagContent 
        tag={tag} 
        insights={tagInsights}
        adaptive={adaptive}
        onInteraction={handleInteraction}
      />
      <TagFooter 
        tag={tag} 
        insights={tagInsights}
        onInteraction={handleInteraction}
      />
    </div>
  );
};
```

### Tag Configuration Panel
```typescript
// TagConfigPanel.tsx
import React, { useState, useEffect } from 'react';

export const TagConfigPanel: React.FC<{ tagId: string }> = ({ tagId }) => {
  const [config, setConfig] = useState<TagConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [tagId]);

  const loadConfiguration = async () => {
    try {
      const response = await apiService.getTagConfiguration(tagId);
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      await apiService.updateTagConfiguration(tagId, config);
      setIsDirty(false);
      // Show success notification
    } catch (error) {
      console.error('Failed to save configuration:', error);
      // Show error notification
    }
  };

  return (
    <div className="tag-config-panel">
      <h3>Tag Configuration</h3>
      
      <div className="config-section">
        <h4>Triggers</h4>
        <TriggerEditor 
          triggers={config?.triggers || []}
          onChange={(triggers) => {
            setConfig(prev => ({ ...prev, triggers }));
            setIsDirty(true);
          }}
        />
      </div>

      <div className="config-section">
        <h4>Actions</h4>
        <ActionEditor 
          actions={config?.actions || []}
          onChange={(actions) => {
            setConfig(prev => ({ ...prev, actions }));
            setIsDirty(true);
          }}
        />
      </div>

      <div className="config-section">
        <h4>Conditions</h4>
        <ConditionEditor 
          conditions={config?.conditions || []}
          onChange={(conditions) => {
            setConfig(prev => ({ ...prev, conditions }));
            setIsDirty(true);
          }}
        />
      </div>

      <div className="config-actions">
        <button 
          onClick={loadConfiguration}
          disabled={!isDirty}
        >
          Reset
        </button>
        <button 
          onClick={saveConfiguration}
          disabled={!isDirty}
          className="primary"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
```

## Error Handling

### Error Boundaries
```typescript
// AdaptiveTagErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tagId: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdaptiveTagErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Adaptive Tag Error:', error, errorInfo);
    
    // Report to error tracking service
    reportError(error, {
      component: 'AdaptiveTag',
      tagId: this.props.tagId,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="adaptive-tag-error">
          <h3>Tag Error</h3>
          <p>Unable to load tag: {this.props.tagId}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Retry Mechanism
```typescript
// useApiRetry.ts
import { useState, useCallback } from 'react';

interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  maxBackoff: number;
}

export const useApiRetry = (config: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  maxBackoff: 10000
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    try {
      setIsRetrying(true);
      const result = await operation();
      setRetryCount(0);
      return result;
    } catch (error) {
      if (retryCount < config.maxAttempts - 1) {
        const delay = Math.min(
          config.backoffMultiplier ** retryCount * 1000,
          config.maxBackoff
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        setRetryCount(prev => prev + 1);
        
        return executeWithRetry(operation);
      }
      
      setIsRetrying(false);
      throw error;
    }
  }, [retryCount, config]);

  return { executeWithRetry, retryCount, isRetrying };
};
```

## Testing Approach

### Unit Tests
```typescript
// AdaptiveTag.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdaptiveTag } from './AdaptiveTag';
import { useAdaptiveTagsStore } from '../store/adaptiveTagsStore';

// Mock the store
jest.mock('../store/adaptiveTagsStore');

describe('AdaptiveTag', () => {
  const mockTag = {
    id: 'test-tag-1',
    name: 'Test Tag',
    type: 'behavioral',
    configuration: { triggers: [], actions: [], conditions: [] }
  };

  beforeEach(() => {
    (useAdaptiveTagsStore as jest.Mock).mockReturnValue({
      tags: new Map([['test-tag-1', mockTag]]),
      insights: new Map(),
      addTag: jest.fn(),
      updateTag: jest.fn(),
      updateInsights: jest.fn(),
      removeTag: jest.fn()
    });
  });

  it('renders tag correctly', () => {
    render(<AdaptiveTag tagId="test-tag-1" />);
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const onInteraction = jest.fn();
    render(<AdaptiveTag tagId="test-tag-1" onInteraction={onInteraction} />);
    
    const tagElement = screen.getByTestId('adaptive-tag');
    fireEvent.click(tagElement);
    
    await waitFor(() => {
      expect(onInteraction).toHaveBeenCalledWith({
        type: 'click',
        tagId: 'test-tag-1',
        timestamp: expect.any(Date)
      });
    });
  });

  it('displays loading state', () => {
    (useAdaptiveTagsStore as jest.Mock).mockReturnValue({
      tags: new Map(),
      insights: new Map(),
      addTag: jest.fn(),
      updateTag: jest.fn(),
      updateInsights: jest.fn(),
      removeTag: jest.fn()
    });

    render(<AdaptiveTag tagId="test-tag-1" />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// adaptiveTags.integration.test.ts
import { setupTestServer } from '../test-utils/setup';
import { createTestUser, createTestTag } from '../test-utils/factories';

describe('Adaptive Tags Integration', () => {
  let server: any;
  let user: any;
  let tag: any;

  beforeAll(async () => {
    server = await setupTestServer();
    user = await createTestUser();
    tag = await createTestTag(user.id);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create, update, and retrieve tags', async () => {
    // Create tag
    const createResponse = await request(server)
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        name: 'Integration Test Tag',
        type: 'behavioral',
        configuration: {
          triggers: [{ event: 'click', selector: '.test-element' }],
          actions: [{ type: 'track', payload: { event: 'test_event' } }],
          conditions: []
        }
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);

    // Retrieve tag
    const getResponse = await request(server)
      .get(`/api/v1/tags/${createResponse.body.data.id}`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.name).toBe('Integration Test Tag');

    // Update tag
    const updateResponse = await request(server)
      .patch(`/api/v1/tags/${createResponse.body.data.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        name: 'Updated Integration Test Tag'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe('Updated Integration Test Tag');
  });

  it('should handle real-time insights', async () => {
    const ws = new WebSocket(`ws://localhost:${server.port}/insights/stream?tagId=${tag.id}&token=${user.token}`);
    
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        expect(data.type).toBe('insight_update');
        expect(data.tagId).toBe(tag.id);
        ws.close();
        resolve(data);
      };

      ws.onerror = (error) => {
        reject(error);
      };
    });
  });
});
```

### End-to-End Tests
```typescript
// adaptiveTags.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Adaptive Tags E2E', () => {
  test('complete tag lifecycle', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to tags page
    await page.click('[data-testid="tags-menu"]');
    await page.click('[data-testid="create-tag-button"]');
    
    // Create new tag
    await page.fill('[data-testid="tag-name"]', 'E2E Test Tag');
    await page.selectOption('[data-testid="tag-type"]', 'behavioral');
    await page.click('[data-testid="add-trigger"]');
    await page.selectOption('[data-testid="trigger-event"]', 'click');
    await page.fill('[data-testid="trigger-selector"]', '.test-button');
    await page.click('[data-testid="save-tag"]');
    
    // Verify tag appears in list
    await expect(page.locator('[data-testid="tag-list"]')).toContainText('E2E Test Tag');
    
    // Interact with tag
    await page.click('.test-button');
    
    // Verify interaction is tracked
    await expect(page.locator('[data-testid="interaction-log"]')).toContainText('click');
    
    // Update tag configuration
    await page.click('[data-testid="edit-tag"]');
    await page.fill('[data-testid="tag-name"]', 'Updated E2E Test Tag');
    await page.click('[data-testid="save-tag"]');
    
    // Verify update
    await expect(page.locator('[data-testid="tag-list"]')).toContainText('Updated E2E Test Tag');
  });
});
```

## Deployment & CI/CD

### Docker Configuration
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_BHIV_API_URL=http://bhiv-core:8000
      - REACT_APP_INSIGHT_BRIDGE_URL=http://insight-bridge:8080
    depends_on:
      - bhiv-core
      - insight-bridge
      - redis

  bhiv-core:
    build:
      context: ./bhiv-core
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/bhiv_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  insight-bridge:
    build:
      context: ./insight-bridge
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - KAFKA_BROKERS=kafka:9092
      - REDIS_URL=redis://redis:6379
    depends_on:
      - kafka
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=bhiv_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
volumes:
  postgres_data:
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Adaptive Tags System

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Run linting
        run: npm run lint
      
      - name: Check type safety
        run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t adaptive-tags-frontend:${{ github.sha }} .
          docker build -t adaptive-tags-backend:${{ github.sha }} ./bhiv-core
          docker build -t adaptive-tags-insights:${{ github.sha }} ./insight-bridge
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push adaptive-tags-frontend:${{ github.sha }}
          docker push adaptive-tags-backend:${{ github.sha }}
          docker push adaptive-tags-insights:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          kubectl set image deployment/frontend adaptive-tags-frontend=${{ github.sha }}
          kubectl set image deployment/bhiv-core adaptive-tags-backend=${{ github.sha }}
          kubectl set image deployment/insight-bridge adaptive-tags-insights=${{ github.sha }}
      
      - name: Run smoke tests
        run: |
          # Wait for deployment to be ready
          kubectl wait --for=condition=available --timeout=300s deployment/frontend
          kubectl wait --for=condition=available --timeout=300s deployment/bhiv-core
          kubectl wait --for=condition=available --timeout=300s deployment/insight-bridge
          
          # Run smoke tests
          npm run test:smoke
      
      - name: Deploy to production
        if: success()
        run: |
          # Deploy to production with approval
          # This would typically involve a manual approval step
          echo "Deploying to production..."
```

## Developer Documentation

### Quick Start Guide

1. **Environment Setup**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd adaptive-tags-integration
   
   # Install dependencies
   npm install
   
   # Start development services
   docker-compose up -d postgres redis
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start development server
   npm run dev
   ```

2. **Development Workflow**
   - Create feature branch from `main`
   - Write tests for new functionality
   - Implement feature with proper error handling
   - Update documentation
   - Create pull request with tests passing

3. **API Documentation**
   - BHIV Core API docs: `http://localhost:8000/docs`
   - Insight Bridge API docs: `http://localhost:8080/docs`

### Code Style Guidelines

```typescript
// Use TypeScript for type safety
interface TagConfiguration {
  readonly id: string;
  readonly name: string;
  readonly triggers: TagTrigger[];
  readonly actions: TagAction[];
}

// Use async/await for asynchronous operations
async function createTag(config: TagConfig): Promise<Tag> {
  try {
    const response = await apiService.post('/tags', config);
    return response.data;
  } catch (error) {
    throw new TagCreationError('Failed to create tag', error);
  }
}

// Use proper error handling
try {
  await createTag(config);
} catch (error) {
  if (error instanceof TagCreationError) {
    // Handle specific error type
    console.error('Tag creation failed:', error.message);
  }
}
```

### Performance Guidelines

1. **Component Optimization**
   - Use React.memo for expensive components
   - Implement proper key props for lists
   - Use useMemo and useCallback for expensive computations

2. **API Optimization**
   - Implement proper caching strategies
   - Use pagination for large datasets
   - Implement request debouncing

3. **State Management**
   - Use normalized state structure
   - Implement proper subscription management
   - Clean up subscriptions on component unmount

## Implementation Guide

### Phase 1: Foundation (Week 1-2)
- [ ] Set up development environment
- [ ] Implement basic API services
- [ ] Create core data models
- [ ] Set up authentication system
- [ ] Implement basic error handling

### Phase 2: Core Components (Week 3-4)
- [ ] Build AdaptiveTag component
- [ ] Implement tag configuration panel
- [ ] Create state management system
- [ ] Add WebSocket connection for real-time updates
- [ ] Implement basic testing suite

### Phase 3: Advanced Features (Week 5-6)
- [ ] Add Insight Bridge integration
- [ ] Implement adaptive behavior logic
- [ ] Create analytics dashboard
- [ ] Add comprehensive error boundaries
- [ ] Performance optimization

### Phase 4: Production Readiness (Week 7-8)
- [ ] Complete E2E testing
- [ ] Security audit and hardening
- [ ] Documentation completion
- [ ] Deployment configuration
- [ ] Monitoring and logging setup

### Milestone Verification Points

1. **After Phase 1**
   - All services can start successfully
   - Authentication flow works
   - Basic API endpoints are functional

2. **After Phase 2**
   - Tags can be created, updated, and displayed
   - Real-time updates are working
   - Unit tests pass with >80% coverage

3. **After Phase 3**
   - Adaptive behavior is functional
   - Integration tests pass
   - Performance benchmarks are met

4. **After Phase 4**
   - E2E tests pass in staging
   - Security scan passes
   - Documentation is complete
   - Production deployment is successful

This comprehensive guide provides a complete specification for implementing the Adaptive Tags integration system, covering all aspects from architecture to deployment and including practical code examples and implementation guidance.