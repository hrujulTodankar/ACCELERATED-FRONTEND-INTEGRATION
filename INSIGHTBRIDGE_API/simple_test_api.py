#!/usr/bin/env python3
"""
Simple test API for InsightBridge integration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import uvicorn
import time

app = FastAPI(
    title="InsightBridge Test API",
    description="Simple test API for multi-backend integration",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
    uptime_seconds: int

@app.on_event("startup")
async def startup_event():
    """Initialize the service"""
    print("InsightBridge Test API started successfully")

@app.get("/", response_model=Dict[str, str])
async def root():
    """Health check endpoint"""
    return {
        "service": "InsightBridge Test API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": "2025-12-19T08:12:51Z"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check with detailed status"""
    return HealthResponse(
        status="healthy",
        timestamp="2025-12-19T08:12:51Z",
        services={
            "signature": "active",
            "jwt": "active", 
            "nonce": "active",
            "hashchain": "active",
            "receiver": "active"
        },
        uptime_seconds=0
    )

@app.get("/audit/status")
async def get_audit_status():
    """Get audit status"""
    return {
        "chain_length": 42,
        "last_hash": "abc123def456",
        "total_messages": 15,
        "buffer_status": "healthy"
    }

@app.get("/audit/hashchain")
async def get_hashchain():
    """Get hash chain"""
    return [
        {"hash": "genesis", "data": {"type": "start"}, "prev": "NONE"},
        {"hash": "abc123", "data": {"type": "action", "user": "test"}, "prev": "genesis"},
    ]

@app.post("/security/nonce/check")
async def check_nonce(nonce: str):
    """Check nonce (mock implementation)"""
    return {
        "accepted": True,
        "message": "Nonce accepted"
    }

@app.post("/auth/jwt/create")
async def create_jwt(payload: Dict[str, Any]):
    """Create JWT token (mock implementation)"""
    return {
        "token": "mock.jwt.token",
        "payload": payload,
        "expires_at": int(time.time()) + 3600
    }

@app.post("/signature/sign")
async def sign_message(message: str):
    """Sign message (mock implementation)"""
    import base64
    mock_signature = base64.b64encode(b"mock_signature").decode('utf-8')
    return {
        "success": True,
        "signature": mock_signature,
        "key_id": "default",
        "message": "Message signed successfully"
    }

if __name__ == "__main__":
    uvicorn.run(
        "simple_test_api:app",
        host="0.0.0.0",
        port=8004,
        reload=False,
        log_level="info"
    )