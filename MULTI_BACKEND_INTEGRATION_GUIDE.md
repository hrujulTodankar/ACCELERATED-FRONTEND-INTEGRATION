# Multi-Backend Integration Guide: BHIV + InsightBridge

## Overview

This guide documents the integration of Akash Choudhary's InsightBridge Phase 3 security features with the existing BHIV backend in our Content Moderation Dashboard. The integration creates a unified, multi-backend architecture that enhances content moderation with security verification and audit capabilities.

## Architecture

### Backend Services

1. **BHIV Backend** (Port 8001)
   - Primary content moderation service
   - Knowledge base queries
   - Analytics and NLP processing
   - Web interface (Port 8003)

2. **InsightBridge Security API** (Port 8004)
   - RSA signature verification
   - JWT authentication
   - Nonce protection (replay attack prevention)
   - Hash-chain audit trail
   - Message integrity checks

3. **Frontend Dashboard** (Vite Dev Server)
   - Unified API service layer
   - Multi-backend health monitoring
   - Backend selection and fallback logic
   - Security-enhanced moderation interface

### Service Flow

```
Frontend Dashboard
       ↓
Unified API Service
       ↓
┌─────────────────┬─────────────────┐
│   BHIV Backend  │ InsightBridge   │
│   (Port 8001)   │  Security API   │
│                 │   (Port 8004)   │
│ • Moderation    │ • Signatures    │
│ • Analytics     │ • JWT Auth      │
│ • NLP           │ • Audit Trail   │
│ • Knowledge     │ • Integrity     │
└─────────────────┴─────────────────┘
```

## Integration Features

### Security Enhancement

1. **Signature Verification**
   - All moderation decisions can be cryptographically signed
   - RSA key-based authentication for sensitive operations
   - Tamper-evident audit trails

2. **JWT Authentication**
   - Secure session management for user actions
   - Token-based authorization for API calls
   - Automatic token expiration and renewal

3. **Audit Trail**
   - Immutable hash-chain ledger for all actions
   - Before/after proof for all operations
   - Complete audit compliance

4. **Replay Protection**
   - Nonce-based attack prevention
   - Duplicate request detection
   - Secure request handling

### Content Moderation Enhancement

1. **Dual Analysis**
   - BHIV provides content analysis and moderation
   - InsightBridge provides security verification
   - Combined results for enhanced accuracy

2. **Fallback Strategy**
   - Primary: BHIV backend (highest priority)
   - Secondary: InsightBridge security verification
   - Automatic failover on service unavailability

3. **Health Monitoring**
   - Real-time backend health checks
   - Service availability monitoring
   - Performance metrics tracking

## Configuration

### Environment Variables

#### Multi-Backend Configuration (.env.multi-backend)

```bash
# BHIV Backend Configuration
VITE_BHIV_API_URL=http://localhost:8001
VITE_USE_BHIV_BACKEND=true
VITE_USE_BHIV_ANALYTICS=true
VITE_USE_BHIV_NLP=true
VITE_USE_BHIV_TAGS=true

# InsightBridge Security Configuration
VITE_INSIGHTBRIDGE_API_URL=http://localhost:8004
VITE_USE_INSIGHTBRIDGE_BACKEND=true
VITE_USE_INSIGHTBRIDGE_SECURITY=true
VITE_USE_INSIGHTBRIDGE_AUDIT=true
VITE_USE_INSIGHTBRIDGE_SIGNATURE=true

# Multi-Backend Strategy
VITE_BACKEND_STRATEGY=priority-fallback
VITE_PRIMARY_BACKEND=bhiv
VITE_SECONDARY_BACKEND=insightbridge
VITE_ENABLE_BACKEND_HEALTH_CHECKS=true

# Security Features
VITE_ENABLE_RSA_SIGNING=true
VITE_ENABLE_JWT_AUTH=true
VITE_ENABLE_NONCE_PROTECTION=true
VITE_ENABLE_HASHCHAIN_AUDIT=true
```

### Backend Service Configuration

#### BHIV Services (Already Running)
- API Server: `http://localhost:8001`
- Web Interface: `http://localhost:8003`
- MCP Bridge: `http://localhost:8002`

#### InsightBridge Security API (New)
- API Server: `http://localhost:8004`
- WebSocket: `ws://localhost:8004/ws`
- Monitor: `http://localhost:8006`

## API Endpoints

### BHIV Backend Endpoints
- `GET /health` - Health check
- `GET /moderate` - Get moderation items
- `POST /feedback` - Submit feedback
- `GET /kb-analytics` - Knowledge base analytics
- `POST /query-kb` - Knowledge base queries

### InsightBridge Security API Endpoints
- `GET /health` - Health check
- `POST /signature/sign` - Sign messages
- `POST /signature/verify` - Verify signatures
- `POST /auth/jwt/create` - Create JWT tokens
- `POST /auth/jwt/verify` - Verify JWT tokens
- `POST /security/nonce/check` - Check nonces
- `POST /audit/hashchain/append` - Append to audit trail
- `GET /audit/hashchain` - Get audit chain
- `GET /audit/status` - Audit system status
- `POST /receiver/message` - Receive secure messages

## Frontend Integration

### Unified API Service (`src/services/unifiedApiService.ts`)

The unified API service provides:
- Automatic backend selection based on priority
- Fallback to secondary backend on failure
- Cross-backend data transformation
- Security feature integration

### Health Monitoring (`src/services/multiBackendHealthService.ts`)

Provides:
- Real-time backend health monitoring
- Feature availability tracking
- Performance metrics
- Automatic health checks

### Usage Examples

#### Basic Moderation Request
```typescript
import { unifiedAPIService } from './services/unifiedApiService';

// Automatically uses best available backend
const items = await unifiedAPIService.getModerationItems({
  page: 1,
  limit: 10,
  type: 'all',
  flagged: 'all'
});
```

#### Security-Enhanced Feedback
```typescript
const feedback = await unifiedAPIService.submitFeedback({
  thumbsUp: true,
  comment: 'Accurate moderation decision',
  userId: 'user123'
});
// Automatically creates JWT and audit trail
```

#### Multi-Backend Health Check
```typescript
import { multiBackendHealthService } from './services/multiBackendHealthService';

const status = await multiBackendHealthService.getMultiBackendStatus();
console.log('Overall status:', status.overallStatus);
console.log('Active backends:', status.activeBackends);
```

## Security Features

### 1. Cryptographic Signing
- RSA key pair generation
- Message signing and verification
- Tamper detection

### 2. JWT Authentication
- Secure token creation
- Automatic expiration
- Session management

### 3. Audit Trail
- Immutable hash chain
- Sequential logging
- Integrity verification

### 4. Replay Protection
- Nonce-based prevention
- Duplicate detection
- Attack mitigation

## Setup Instructions

### 1. Start BHIV Services
```bash
# Terminal 1: BHIV API
cd BHIV_CORE
python simple_api_minimal.py --port 8001 --host 0.0.0.0

# Terminal 2: BHIV Web Interface
cd BHIV_CORE
python -m http.server 8003
```

### 2. Start InsightBridge Security API
```bash
# Terminal 3: InsightBridge API
cd INSIGHTBRIDGE_API
pip install -r requirements.txt
python insightbridge_api.py
```

### 3. Start Frontend Dashboard
```bash
# Terminal 4: Frontend
cp .env.multi-backend .env
npm run dev
```

### 4. Verify Integration
- Open http://localhost:5173
- Check backend health indicators
- Test moderation features
- Verify security enhancements

## Testing

### Health Check Testing
```bash
# Test BHIV health
curl http://localhost:8001/health

# Test InsightBridge health
curl http://localhost:8004/health

# Test frontend health
curl http://localhost:5173
```

### Integration Testing
- Navigate through dashboard features
- Submit feedback and verify audit trail
- Check security indicators
- Monitor backend switching

## Monitoring and Troubleshooting

### Health Monitoring
- Dashboard shows real-time backend status
- Health indicators for each service
- Automatic failover on failures

### Log Files
- BHIV: `BHIV_CORE/logs/`
- InsightBridge: `INSIGHTBRIDGE_API/logs/`
- Frontend: Browser console

### Common Issues

1. **Backend Connection Failed**
   - Check if services are running
   - Verify port availability
   - Check firewall settings

2. **Security Features Not Working**
   - Verify InsightBridge API is running
   - Check JWT configuration
   - Validate RSA keys

3. **Fallback Not Working**
   - Check health monitoring settings
   - Verify fallback configuration
   - Review error logs

## Performance Considerations

### Caching Strategy
- Health checks cached for 30 seconds
- API responses cached when appropriate
- Frontend state management

### Load Balancing
- Currently uses priority-based selection
- Future: Round-robin load balancing
- Automatic service discovery

### Timeout Configuration
- BHIV: 10 seconds
- InsightBridge: 5 seconds
- Security operations: 3 seconds

## Security Best Practices

### Key Management
- RSA keys generated on startup
- Keys stored securely in memory
- No hardcoded secrets

### Token Security
- JWT expiration: 1 hour
- Secure secret configuration
- Automatic token renewal

### Audit Compliance
- All actions logged
- Immutable audit trail
- Tamper-evident records

## Future Enhancements

### Planned Features
1. **WebSocket Support**
   - Real-time updates
   - Live health monitoring
   - Push notifications

2. **Load Balancing**
   - Multiple backend instances
   - Round-robin distribution
   - Health-based routing

3. **Advanced Security**
   - Multi-signature verification
   - Advanced threat detection
   - Compliance reporting

### Scalability
- Horizontal backend scaling
- Microservice architecture
- Container deployment

## Support and Maintenance

### Regular Maintenance
- Monitor backend health
- Update security configurations
- Review audit logs
- Performance optimization

### Backup Strategy
- Configuration backups
- Audit log archival
- Key rotation procedures

### Monitoring Alerts
- Backend unavailability
- Security violations
- Performance degradation
- Audit trail anomalies

## Conclusion

The multi-backend integration successfully combines BHIV's content moderation capabilities with InsightBridge's security features, creating a robust, secure, and scalable content moderation platform. The architecture provides:

- **Enhanced Security**: Cryptographic verification and audit trails
- **Improved Reliability**: Automatic fallback and health monitoring
- **Better Performance**: Intelligent backend selection
- **Complete Auditability**: Immutable audit trails

This integration positions the platform for future growth while maintaining security and compliance standards.