# InsightBridge Security API Integration Guide

## Overview

The InsightBridge Security API provides comprehensive security features for the frontend application, including cryptographic operations, authentication, audit trails, and replay protection. This integration enables secure communication and operations within the content moderation system.

## Features

### 🔐 Cryptographic Operations
- **RSA Signature Creation**: Sign messages using RSA encryption
- **Signature Verification**: Verify the authenticity of signed messages
- **Key Management**: Support for multiple key pairs with different identifiers

### 🛡️ Authentication & Authorization
- **JWT Token Creation**: Generate secure JWT tokens with custom payloads
- **JWT Verification**: Validate JWT tokens and extract payload information
- **Token Expiration**: Configurable expiration times for enhanced security

### 🔄 Security Protections
- **Nonce Management**: Replay attack prevention using unique nonces
- **Message Integrity**: Ensure messages haven't been tampered with
- **Audit Trail**: Complete logging of all security operations

### 📊 Monitoring & Analytics
- **Health Checks**: Monitor the status of all security services
- **Audit Status**: View complete audit trail and system statistics
- **Performance Metrics**: Track response times and success rates

## API Endpoints

### Base Configuration
```javascript
// Default configuration in apiService.ts
const insightsBaseURL = process.env.INSIGHTS_BASE_URL || 'http://localhost:8003';
```

### Core Endpoints

#### Health & Status
```javascript
// Health check with detailed service status
GET /health

// Simple health status
GET /
```

#### Cryptographic Operations
```javascript
// Sign a message
POST /signature/sign
{
  "message": "string",
  "key_id": "string (optional, defaults to 'default')"
}

// Verify a signature
POST /signature/verify
{
  "message": "string",
  "signature": "string (base64 encoded)",
  "public_key_id": "string (optional)"
}
```

#### JWT Authentication
```javascript
// Create JWT token
POST /auth/jwt/create
{
  "payload": { "user": "string", "action": "string" },
  "exp_seconds": "number (optional, defaults to 3600)"
}

// Verify JWT token
POST /auth/jwt/verify
{
  "token": "string"
}
```

#### Security Features
```javascript
// Check nonce (replay protection)
POST /security/nonce/check
{
  "nonce": "string"
}
```

#### Audit Trail
```javascript
// Add entry to hash chain
POST /audit/hashchain/append
{
  "data": { "operation": "string", "timestamp": "ISO8601" }
}

// Get complete hash chain
GET /audit/hashchain

// Get audit status
GET /audit/status
```

#### Message Receiver
```javascript
// Receive message with integrity checks
POST /receiver/message
{
  "message": { "content": "any", "metadata": "object" }
}

// Send heartbeat
POST /receiver/heartbeat
```

## Frontend Integration

### Import the Service Functions
```typescript
import {
  // Basic security operations
  signMessage,
  verifySignature,
  createJWTToken,
  verifyJWTToken,
  checkNonce,
  
  // Audit operations
  appendToHashChain,
  getHashChain,
  getAuditStatus,
  
  // Message operations
  receiveMessage,
  sendHeartbeat,
  
  // Health checks
  checkInsightBridgeHealth,
  
  // Combined operations
  performSecureOperation
} from '../services/apiService';
```

### Basic Usage Examples

#### 1. Simple Message Signing
```typescript
try {
  const response = await signMessage({
    message: "Important operation data",
    key_id: "default"
  });
  
  if (response.success) {
    console.log("Message signed:", response.signature);
  }
} catch (error) {
  console.error("Signing failed:", error);
}
```

#### 2. JWT Token Creation
```typescript
try {
  const tokenData = await createJWTToken({
    payload: {
      userId: "user123",
      action: "moderate_content",
      contentId: "item456"
    },
    exp_seconds: 300 // 5 minutes
  });
  
  console.log("JWT Token:", tokenData.token);
} catch (error) {
  console.error("JWT creation failed:", error);
}
```

#### 3. Combined Secure Operation
```typescript
try {
  const result = await performSecureOperation(
    "moderate_content",
    {
      contentId: "item123",
      decision: "approve",
      confidence: 0.95
    },
    {
      requireSignature: true,
      requireJWT: true,
      requireNonce: true,
      keyId: "default"
    }
  );
  
  if (result.success) {
    console.log("Secure operation completed:", result.audit_hash);
  }
} catch (error) {
  console.error("Secure operation failed:", error);
}
```

#### 4. Audit Trail Management
```typescript
try {
  // Add entry to audit trail
  const auditEntry = await appendToHashChain({
    data: {
      operation: "user_login",
      userId: "user123",
      timestamp: new Date().toISOString(),
      success: true
    }
  });
  
  // Get audit status
  const status = await getAuditStatus();
  console.log("Audit status:", status);
  
} catch (error) {
  console.error("Audit operation failed:", error);
}
```

## Environment Configuration

### Required Environment Variables
```bash
# Service URLs
VITE_INSIGHTS_BASE_URL=http://localhost:8003

# Feature Flags
VITE_USE_INSIGHTBRIDGE_SECURITY=true
VITE_ENABLE_SIGNATURE_VERIFICATION=true
VITE_ENABLE_JWT_AUTHENTICATION=true
VITE_ENABLE_AUDIT_TRAIL=true
VITE_ENABLE_NONCE_PROTECTION=true

# Security Settings
VITE_REQUIRE_SIGNATURE_FOR_CRITICAL_OPS=false

# Timeouts
VITE_INSIGHTBRIDGE_TIMEOUT=5000
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_INSIGHTBRIDGE_SECURITY` | `false` | Enable all InsightBridge features |
| `VITE_ENABLE_SIGNATURE_VERIFICATION` | `false` | Enable RSA signature operations |
| `VITE_ENABLE_JWT_AUTHENTICATION` | `false` | Enable JWT token operations |
| `VITE_ENABLE_AUDIT_TRAIL` | `false` | Enable audit trail logging |
| `VITE_ENABLE_NONCE_PROTECTION` | `false` | Enable replay attack protection |
| `VITE_REQUIRE_SIGNATURE_FOR_CRITICAL_OPS` | `false` | Require signatures for critical operations |

## Security Best Practices

### 1. Always Use HTTPS
Ensure all communication with the InsightBridge API uses HTTPS in production environments.

### 2. Validate Responses
Always check the success status and validate response data before proceeding with operations.

### 3. Handle Errors Gracefully
Implement proper error handling for all security operations to prevent system exposure.

### 4. Use Appropriate Timeouts
Set reasonable timeouts for security operations to prevent hanging requests.

### 5. Audit Critical Operations
Enable audit trail for all critical operations to maintain security compliance.

## Testing

### Running Integration Tests
```bash
# Test InsightBridge API integration
node test_insightbridge_integration.js

# Set custom API URL
INSIGHTBRIDGE_API_URL=http://localhost:8003 node test_insightbridge_integration.js
```

### Test Coverage
The test script validates:
- ✅ Health check endpoints
- ✅ Signature creation and verification
- ✅ JWT token operations
- ✅ Nonce checking
- ✅ Audit trail operations
- ✅ Message receiver functionality
- ✅ Combined security operations

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:8003
```
**Solution**: Ensure InsightBridge API service is running on the specified port.

#### 2. Timeout Errors
```
Error: timeout of 5000ms exceeded
```
**Solution**: Check network connectivity and increase timeout values if needed.

#### 3. Signature Verification Failures
```
Error: Invalid signature
```
**Solution**: Verify that the message and signature match exactly, including encoding.

#### 4. JWT Verification Issues
```
Error: JWT verification failed
```
**Solution**: Check token expiration and ensure the token hasn't been modified.

### Debug Mode
Enable detailed logging by setting:
```bash
VITE_DEV_MODE=true
```

## Performance Considerations

### Caching
- Cache JWT tokens to avoid repeated creation
- Cache public keys for signature verification
- Implement local storage for frequently used audit data

### Batching
- Batch multiple operations when possible
- Use combined security operations for complex workflows

### Monitoring
- Monitor response times for all security operations
- Track success/failure rates
- Set up alerts for security-related errors

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": "operation_specific_data",
  "timestamp": "2025-12-29T10:40:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-12-29T10:40:00.000Z"
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T10:40:00.000Z",
  "services": {
    "signature": "active",
    "jwt": "active",
    "nonce": "active",
    "hashchain": "active",
    "receiver": "active"
  },
  "uptime_seconds": 3600
}
```

## Future Enhancements

### Planned Features
- [ ] Multi-key support with key rotation
- [ ] Hardware security module (HSM) integration
- [ ] Advanced audit analytics dashboard
- [ ] Real-time security event streaming
- [ ] Automated threat detection

### Integration Roadmap
1. **Phase 1**: Basic security operations (✅ Complete)
2. **Phase 2**: Advanced audit features (📋 In Progress)
3. **Phase 3**: Real-time monitoring (📋 Planned)
4. **Phase 4**: ML-based security analytics (📋 Planned)

## Support & Maintenance

### Regular Maintenance
- Monitor API health and performance
- Update security certificates and keys
- Review and analyze audit logs
- Update dependencies and security patches

### Getting Help
- Check the troubleshooting section above
- Review API documentation at `/docs` endpoint
- Enable debug logging for detailed error information
- Contact the development team for complex issues

---

**Last Updated**: December 29, 2025  
**Version**: 1.0.0  
**Compatibility**: Frontend API Service v1.0+