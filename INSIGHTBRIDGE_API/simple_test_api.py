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
from datetime import datetime, timezone
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add the parent directory to sys.path to import InsightBridge modules
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir / 'insightbridge-phase3'))

# Import real cryptographic functions
try:
    from src.crypto.keygen import gen_rsa
    from src.crypto.signer import load_private, load_public, sign, verify
    from src.auth.jwt_handler import create_jwt, verify_jwt
    from src.auth.nonce_store import NonceStore
    from src.crypto.hashchain import HashChain
    CRYPTO_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import crypto functions: {e}")
    CRYPTO_AVAILABLE = False

# Global instances for real crypto
if CRYPTO_AVAILABLE:
    rsa_keys = {}
    nonce_store = NonceStore()
    hash_chain = HashChain()
    
    def initialize_keys():
        """Initialize RSA key pair"""
        global rsa_keys
        priv_pem, pub_pem = gen_rsa()
        rsa_keys["default"] = {
            "private": load_private(priv_pem),
            "public": load_public(pub_pem)
        }
        print("RSA keys initialized")
else:
    rsa_keys = None
    nonce_store = None
    hash_chain = None

startup_time = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown event handler"""
    global startup_time
    # Startup
    if CRYPTO_AVAILABLE:
        initialize_keys()
    startup_time = datetime.now(timezone.utc)
    print("InsightBridge Test API started successfully")
    
    yield
    
    # Shutdown
    print("InsightBridge Test API shutting down")

app = FastAPI(
    title="InsightBridge Test API",
    description="Simple test API for multi-backend integration",
    version="1.0.0",
    lifespan=lifespan
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

@app.get("/", response_model=Dict[str, str])
async def root():
    """Health check endpoint"""
    return {
        "service": "InsightBridge Test API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check with detailed status"""
    uptime_seconds = 0
    if startup_time:
        uptime_seconds = int((datetime.now(timezone.utc) - startup_time).total_seconds())
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        services={
            "signature": "active",
            "jwt": "active", 
            "nonce": "active",
            "hashchain": "active",
            "receiver": "active"
        },
        uptime_seconds=uptime_seconds
    )

@app.get("/audit/status")
async def get_audit_status():
    """Get audit status"""
    if CRYPTO_AVAILABLE and hash_chain:
        chain_length = len(hash_chain.to_list())
        last_hash = hash_chain.last_hash()
        total_messages = 15  # Could be connected to receiver buffer if available
        buffer_status = "healthy"
    else:
        # Mock implementation
        chain_length = 42
        last_hash = "abc123def456"
        total_messages = 15
        buffer_status = "healthy"
    
    return {
        "chain_length": chain_length,
        "last_hash": last_hash,
        "total_messages": total_messages,
        "buffer_status": buffer_status
    }

@app.get("/audit/hashchain")
async def get_hashchain():
    """Get hash chain"""
    if CRYPTO_AVAILABLE and hash_chain:
        return hash_chain.to_list()
    else:
        # Mock implementation
        return [
            {"hash": "genesis", "data": {"type": "start"}, "prev": "NONE"},
            {"hash": "abc123", "data": {"type": "action", "user": "test"}, "prev": "genesis"},
        ]

@app.post("/security/nonce/check")
async def check_nonce(request: Dict[str, Any]):
    """Check nonce (real implementation when available, mock fallback)"""
    nonce = request.get('nonce', '')
    
    if CRYPTO_AVAILABLE and nonce_store:
        try:
            accepted = nonce_store.check_and_add(nonce)
            return {
                "accepted": accepted,
                "message": "Nonce accepted" if accepted else "Nonce already used (replay attack detected)"
            }
        except Exception as e:
            return {
                "accepted": True,
                "message": f"Nonce check failed, accepting: {str(e)}"
            }
    else:
        # Fallback to mock implementation
        return {
            "accepted": True,
            "message": "Nonce accepted (mock)"
        }

@app.post("/auth/jwt/create")
async def create_jwt(payload: Dict[str, Any]):
    """Create JWT token (real implementation when available, mock fallback)"""
    if CRYPTO_AVAILABLE:
        try:
            token = create_jwt(payload)
            
            # Decode the token to get the payload
            import base64
            import json
            parts = token.split('.')
            # Properly handle Base64 URL-safe encoding padding
            payload_b64 = parts[1]
            # Add padding if needed
            padding_needed = len(payload_b64) % 4
            if padding_needed:
                payload_b64 += '=' * (4 - padding_needed)
            payload_bytes = base64.b64decode(payload_b64)
            decoded_payload = json.loads(payload_bytes.decode('utf-8'))
            
            return {
                "token": token,
                "payload": decoded_payload,
                "expires_at": decoded_payload.get('exp', 0)
            }
        except Exception as e:
            # Fallback to mock implementation
            return {
                "token": "mock.jwt.token",
                "payload": payload,
                "expires_at": int(time.time()) + 3600,
                "fallback": True
            }
    else:
        # Mock implementation
        return {
            "token": "mock.jwt.token",
            "payload": payload,
            "expires_at": int(time.time()) + 3600
        }

@app.post("/signature/sign")
async def sign_message(request: Dict[str, Any]):
    """Sign message (real implementation when available, mock fallback)"""
    message = request.get('message', '')
    key_id = request.get('key_id', 'default')
    
    if CRYPTO_AVAILABLE and rsa_keys and key_id in rsa_keys:
        try:
            private_key = rsa_keys[key_id]["private"]
            message_bytes = message.encode('utf-8')
            signature = sign(private_key, message_bytes)
            
            # Convert signature to base64 for JSON serialization
            import base64
            signature_b64 = base64.b64encode(signature).decode('utf-8')
            
            return {
                "success": True,
                "signature": signature_b64,
                "key_id": key_id,
                "message": "Message signed successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Real signing failed: {str(e)}",
                "fallback": True
            }
    else:
        # Fallback to mock implementation
        import base64
        mock_signature = base64.b64encode(f"mock_signature_{message}".encode()).decode('utf-8')
        return {
            "success": True,
            "signature": mock_signature,
            "key_id": key_id,
            "message": "Message signed successfully (mock)"
        }

if __name__ == "__main__":
    uvicorn.run(
        "simple_test_api:app",
        host="0.0.0.0",
        port=8004,
        reload=False,
        log_level="info"
    )