/**
 * Security Optimization Service
 * Simplified security measures for the unified integration system
 */

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  authFailures: number;
  rateLimitHits: number;
  averageResponseTime: number;
  uptime: number;
  lastUpdate: string;
}

export interface RateLimitEntry {
  ip: string;
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}

export class SecurityOptimizationService {
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private metrics: SecurityMetrics;
  private config = {
    rateLimit: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      banDuration: 30 * 60 * 1000, // 30 minutes
    }
  };

  constructor() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      authFailures: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
      uptime: Date.now(),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Check if request is within rate limits
   */
  checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    if (!this.config.rateLimit.enabled) {
      return { allowed: true, remaining: -1, resetTime: Date.now() };
    }

    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;
    
    let entry = this.rateLimits.get(ip);
    if (!entry) {
      entry = { ip, requests: [], blocked: false };
      this.rateLimits.set(ip, entry);
    }

    // Clean old requests
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    
    // Check if blocked
    if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      this.metrics.rateLimitHits++;
      return { allowed: false, remaining: 0, resetTime: entry.blockedUntil! };
    } else if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
      // Unblock
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.requests = [];
    }

    // Check rate limit
    if (entry.requests.length >= this.config.rateLimit.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + this.config.rateLimit.banDuration;
      
      this.metrics.rateLimitHits++;
      console.log(`[Security] Rate limit exceeded for IP ${ip}`);

      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: entry.blockedUntil! 
      };
    }

    // Add current request
    entry.requests.push(now);
    this.metrics.totalRequests++;

    return {
      allowed: true,
      remaining: this.config.rateLimit.maxRequests - entry.requests.length,
      resetTime: now + this.config.rateLimit.windowMs
    };
  }

  /**
   * Validate input for basic security threats
   */
  validateInput(data: any): { valid: boolean; threats: string[] } {
    const threats: string[] = [];
    
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Simple threat detection
    const suspiciousPatterns = [
      { pattern: /script/gi, name: 'Script Tag' },
      { pattern: /javascript:/gi, name: 'JavaScript Protocol' },
      { pattern: /on\\w+=/gi, name: 'Event Handler' },
      { pattern: /eval\(/gi, name: 'Eval Function' },
      { pattern: /\\.\\./gi, name: 'Path Traversal' },
    ];

    for (const { pattern, name } of suspiciousPatterns) {
      if (pattern.test(dataString)) {
        threats.push(name);
      }
    }

    return { valid: threats.length === 0, threats };
  }

  /**
   * Log security event
   */
  logSecurityEvent(type: string, description: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    console.log(`[Security ${severity.toUpperCase()}] ${type}: ${description}`);
    
    if (severity === 'high') {
      this.metrics.blockedRequests++;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return {
      ...this.metrics,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get rate limit status for IP
   */
  getRateLimitStatus(ip: string): RateLimitEntry | null {
    return this.rateLimits.get(ip) || null;
  }

  /**
   * Handle authentication failure
   */
  handleAuthFailure(ip: string): void {
    this.metrics.authFailures++;
    this.logSecurityEvent('AUTH_FAILURE', `Authentication failure from ${ip}`, 'medium');
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [ip, entry] of this.rateLimits.entries()) {
      const lastRequest = Math.max(...entry.requests, 0);
      if (now - lastRequest > maxAge) {
        this.rateLimits.delete(ip);
      }
    }
  }

  /**
   * Shutdown security service
   */
  shutdown(): void {
    this.cleanup();
    console.log('[Security] Security service shutdown');
  }
}

// Export singleton instance
export const securityOptimizationService = new SecurityOptimizationService();

export default SecurityOptimizationService;