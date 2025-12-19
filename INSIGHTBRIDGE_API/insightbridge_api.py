#!/usr/bin/env python3
"""
InsightBridge Phase 3 HTTP API Wrapper
Exposes security verification features as REST endpoints
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import uvicorn
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import InsightBridge modules
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir / 'insightbridge-phase3'))

from src.crypto.keygen import gen_rsa
from src.crypto.signer import load_private, load_public, sign, verify
from src.auth.jwt_handler import create_jwt, verify_jwt
from src.auth.nonce_store import NonceStore
from src.crypto.hashchain import HashChain
from src.receiver.receiver import Receiver
from src.common.utils import ensure_dirs
from src.common.config import LOG_DIR

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="InsightBridge Security API",
    description="Security verification and audit API for content moderation",
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

# Global instances
nonce_store = NonceStore()
hash_chain = HashChain()
receiver = Receiver(max_buffer=100)
rsa_keys = {}

class SignatureRequest(BaseModel):
    message: str = Field(..., description="Message to sign")
    key_id: str = Field("default", description="Key identifier")

class VerifyRequest(BaseModel):
    message: str = Field(..., description="Original message")
    signature: str = Field(..., description="Base64 encoded signature")
    public_key_id: str = Field("default", description="Public key identifier")

class JWTRequest(BaseModel):
    payload: Dict[str, Any] = Field(..., description="JWT payload")
    exp_seconds: int = Field(3600, description="Expiration time in seconds")

class VerifyJWTRequest(BaseModel):
    token: str = Field(..., description="JWT token to verify")

class NonceRequest(BaseModel):
    nonce: str = Field(..., description="Nonce to check")

class HashChainEntry(BaseModel):
    data: Dict[str, Any] = Field(..., description="Data to append to chain")

class MessageRequest(BaseModel):
    message: Dict[str, Any] = Field(..., description="Message to receive")
    corrupt: Optional[bool] = Field(False, description="Simulate corruption")

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
    uptime_seconds: int

class SignatureResponse(BaseModel):
    success: bool
    signature: Optional[str] = None
    key_id: str
    message: str

class VerifyResponse(BaseModel):
    valid: bool
    message: str
    details: Optional[str] = None

class JWTResponse(BaseModel):
    token: str
    payload: Dict[str, Any]
    expires_at: int

class JWTVerifyResponse(BaseModel):
    valid: bool
    payload: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class NonceResponse(BaseModel):
    accepted: bool
    message: str

class HashChainResponse(BaseModel):
    hash: str
    previous_hash: str
    entry_count: int
    data: Dict[str, Any]

class ReceiverResponse(BaseModel):
    success: bool
    buffer_length: int
    message: str

class AuditResponse(BaseModel):
    chain_length: int
    last_hash: str
    total_messages: int
    buffer_status: str

# Initialize RSA keys
def initialize_keys():
    """Initialize RSA key pair"""
    global rsa_keys
    priv_pem, pub_pem = gen_rsa()
    rsa_keys["default"] = {
        "private": load_private(priv_pem),
        "public": load_public(pub_pem)
    }
    logger.info("RSA keys initialized")

@app.on_event("startup")
async def startup_event():
    """Initialize the service"""
    ensure_dirs()
    initialize_keys()
    logger.info("InsightBridge API started successfully")

@app.get("/", response_model=Dict[str, str])
async def root():
    """Health check endpoint"""
    return {
        "service": "InsightBridge Security API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": "2025-12-19T08:02:41Z"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check with detailed status"""
    return HealthResponse(
        status="healthy",
        timestamp="2025-12-19T08:02:41Z",
        services={
            "signature": "active",
            "jwt": "active", 
            "nonce": "active",
            "hashchain": "active",
            "receiver": "active"
        },
        uptime_seconds=0
    )

@app.post("/signature/sign", response_model=SignatureResponse)
async def sign_message(request: SignatureRequest):
    """Sign a message using RSA"""
    try:
        if request.key_id not in rsa_keys:
            raise HTTPException(status_code=404, detail=f"Key {request.key_id} not found")
        
        private_key = rsa_keys[request.key_id]["private"]
        message_bytes = request.message.encode('utf-8')
        signature = sign(private_key, message_bytes)
        
        # Convert signature to base64 for JSON serialization
        import base64
        signature_b64 = base64.b64encode(signature).decode('utf-8')
        
        return SignatureResponse(
            success=True,
            signature=signature_b64,
            key_id=request.key_id,
            message="Message signed successfully"
        )
    except Exception as e:
        logger.error(f"Signature error: {e}")
        raise HTTPException(status_code=500, detail=f"Signing failed: {str(e)}")

@app.post("/signature/verify", response_model=VerifyResponse)
async def verify_signature(request: VerifyRequest):
    """Verify a signature"""
    try:
        if request.public_key_id not in rsa_keys:
            raise HTTPException(status_code=404, detail=f"Public key {request.public_key_id} not found")
        
        public_key = rsa_keys[request.public_key_id]["public"]
        message_bytes = request.message.encode('utf-8')
        
        # Convert base64 signature back to bytes
        import base64
        signature_bytes = base64.b64decode(request.signature)
        
        is_valid = verify(public_key, message_bytes, signature_bytes)
        
        return VerifyResponse(
            valid=is_valid,
            message="Signature verification completed",
            details="Valid signature" if is_valid else "Invalid signature"
        )
    except Exception as e:
        logger.error(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.post("/auth/jwt/create", response_model=JWTResponse)
async def create_jwt_token(request: JWTRequest):
    """Create a JWT token"""
    try:
        token = create_jwt(request.payload, request.exp_seconds)
        
        # Decode the token to get the payload
        import base64
        import json
        parts = token.split('.')
        payload_bytes = base64.b64decode(parts[1] + '==')  # Add padding
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        return JWTResponse(
            token=token,
            payload=payload,
            expires_at=payload.get('exp', 0)
        )
    except Exception as e:
        logger.error(f"JWT creation error: {e}")
        raise HTTPException(status_code=500, detail=f"JWT creation failed: {str(e)}")

@app.post("/auth/jwt/verify", response_model=JWTVerifyResponse)
async def verify_jwt_token(request: VerifyJWTRequest):
    """Verify a JWT token"""
    try:
        is_valid, result = verify_jwt(request.token)
        
        if is_valid:
            return JWTVerifyResponse(
                valid=True,
                payload=result
            )
        else:
            return JWTVerifyResponse(
                valid=False,
                error=result
            )
    except Exception as e:
        logger.error(f"JWT verification error: {e}")
        raise HTTPException(status_code=500, detail=f"JWT verification failed: {str(e)}")

@app.post("/security/nonce/check", response_model=NonceResponse)
async def check_nonce(request: NonceRequest):
    """Check and store a nonce (replay protection)"""
    try:
        accepted = nonce_store.check_and_add(request.nonce)
        
        return NonceResponse(
            accepted=accepted,
            message="Nonce accepted" if accepted else "Nonce already used (replay attack detected)"
        )
    except Exception as e:
        logger.error(f"Nonce check error: {e}")
        raise HTTPException(status_code=500, detail=f"Nonce check failed: {str(e)}")

@app.post("/audit/hashchain/append", response_model=HashChainResponse)
async def append_to_hashchain(request: HashChainEntry):
    """Append data to the hash chain (audit trail)"""
    try:
        previous_hash = hash_chain.last_hash()
        new_hash = hash_chain.append(request.data)
        
        return HashChainResponse(
            hash=new_hash,
            previous_hash=previous_hash,
            entry_count=len(hash_chain.to_list()),
            data=request.data
        )
    except Exception as e:
        logger.error(f"Hash chain append error: {e}")
        raise HTTPException(status_code=500, detail=f"Hash chain append failed: {str(e)}")

@app.get("/audit/hashchain", response_model=List[Dict[str, Any]])
async def get_hashchain():
    """Get the complete hash chain"""
    try:
        return hash_chain.to_list()
    except Exception as e:
        logger.error(f"Hash chain retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Hash chain retrieval failed: {str(e)}")

@app.post("/receiver/message", response_model=ReceiverResponse)
async def receive_message(request: MessageRequest):
    """Receive a message with integrity checks"""
    try:
        success = receiver.receive(request.message)
        buffer_length = len(receiver.buffer)
        
        return ReceiverResponse(
            success=success,
            buffer_length=buffer_length,
            message="Message received successfully" if success else "Message rejected - integrity check failed or buffer overflow"
        )
    except Exception as e:
        logger.error(f"Message receive error: {e}")
        raise HTTPException(status_code=500, detail=f"Message receive failed: {str(e)}")

@app.post("/receiver/heartbeat")
async def send_heartbeat():
    """Send a heartbeat to confirm liveness"""
    try:
        receiver.heartbeat()
        return {"message": "Heartbeat sent", "status": "ok"}
    except Exception as e:
        logger.error(f"Heartbeat error: {e}")
        raise HTTPException(status_code=500, detail=f"Heartbeat failed: {str(e)}")

@app.get("/audit/status", response_model=AuditResponse)
async def get_audit_status():
    """Get comprehensive audit status"""
    try:
        chain_length = len(hash_chain.to_list())
        last_hash = hash_chain.last_hash()
        total_messages = len(receiver.buffer)
        buffer_status = "healthy" if len(receiver.buffer) < receiver.max_buffer * 0.8 else "warning"
        
        return AuditResponse(
            chain_length=chain_length,
            last_hash=last_hash,
            total_messages=total_messages,
            buffer_status=buffer_status
        )
    except Exception as e:
        logger.error(f"Audit status error: {e}")
        raise HTTPException(status_code=500, detail=f"Audit status failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "insightbridge_api:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )