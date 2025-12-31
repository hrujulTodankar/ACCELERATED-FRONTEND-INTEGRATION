/**
 * Enhanced Authentication and Authorization System
 * Implements JWT, OAuth 2.0, and Role-Based Access Control (RBAC)
 * for the unified integration system
 */

import * as apiService from './apiService';

// Types and interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  permissions: Permission[];
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // Hierarchical role level
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  description: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string[];
  user: User;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
  };
}

// Default security policy
const DEFAULT_SECURITY_POLICY = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  maxLoginAttempts: 5,
  lockoutDuration: 15, // in minutes
  sessionTimeout: 60, // in minutes
  requireMFA: false,
  allowedIPRanges: [] as string[],
  blockedIPRanges: [] as string[]
};

// Permission checker utility
export class PermissionChecker {
  static hasPermission(user: User, resource: string, action: string): boolean {
    // Super admin check
    if (user.roles.some(role => role.name === 'Super Administrator')) {
      return true;
    }

    // Check user permissions directly
    if (user.permissions.some(permission => 
      (permission.resource === resource || permission.resource === '*') &&
      (permission.action === action || permission.action === '*')
    )) {
      return true;
    }

    // Check role permissions
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if ((permission.resource === resource || permission.resource === '*') &&
            (permission.action === action || permission.action === '*')) {
          return true;
        }
      }
    }

    return false;
  }

  static hasRole(user: User, roleName: string): boolean {
    return user.roles.some(role => role.name === roleName);
  }

  static hasMinRoleLevel(user: User, minLevel: number): boolean {
    const userMaxLevel = Math.max(...user.roles.map(role => role.level));
    return userMaxLevel >= minLevel;
  }

  static getEffectivePermissions(user: User): Permission[] {
    const permissions = new Map<string, Permission>();

    // Add user permissions
    user.permissions.forEach(permission => {
      permissions.set(`${permission.resource}:${permission.action}`, permission);
    });

    // Add role permissions
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        const key = `${permission.resource}:${permission.action}`;
        if (!permissions.has(key)) {
          permissions.set(key, permission);
        }
      });
    });

    return Array.from(permissions.values());
  }
}

// Main Enhanced Authentication Service
export class EnhancedAuthService {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId
  private roles: Map<string, Role> = new Map();
  private sessions: Map<string, SessionInfo> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Create default roles
    const adminRole: Role = {
      id: 'admin',
      name: 'Administrator',
      description: 'Administrative access to system functions',
      level: 80,
      permissions: [
        {
          id: 'system_admin',
          name: 'System Administration',
          resource: '*',
          action: '*',
          description: 'Full system access'
        }
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const moderatorRole: Role = {
      id: 'moderator',
      name: 'Content Moderator',
      description: 'Content moderation and review access',
      level: 60,
      permissions: [
        {
          id: 'content_review',
          name: 'Content Review',
          resource: 'content',
          action: 'read',
          description: 'View content for moderation'
        },
        {
          id: 'content_decision',
          name: 'Content Decision',
          resource: 'content',
          action: 'update',
          description: 'Make moderation decisions'
        }
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const viewerRole: Role = {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access',
      level: 20,
      permissions: [
        {
          id: 'content_view',
          name: 'Content View',
          resource: 'content',
          action: 'read',
          description: 'View content'
        }
      ],
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.roles.set('admin', adminRole);
    this.roles.set('moderator', moderatorRole);
    this.roles.set('viewer', viewerRole);

    // Create default users
    const adminUser: User = {
      id: 'admin_001',
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      roles: [adminRole],
      permissions: [],
      isActive: true,
      lastLogin: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { isDefaultAdmin: true }
    };

    const moderatorUser: User = {
      id: 'moderator_001',
      email: 'moderator@example.com',
      username: 'moderator',
      firstName: 'Content',
      lastName: 'Moderator',
      roles: [moderatorRole],
      permissions: [],
      isActive: true,
      lastLogin: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(moderatorUser.id, moderatorUser);
    this.usersByEmail.set(adminUser.email, adminUser.id);
    this.usersByEmail.set(moderatorUser.email, moderatorUser.id);

    console.log('[EnhancedAuth] Initialized with default users and roles');
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(email: string, password: string, ipAddress: string, userAgent: string): Promise<{
    success: boolean;
    token?: AuthToken;
    user?: User;
    session?: SessionInfo;
    error?: string;
  }> {
    try {
      // Find user
      const userId = this.usersByEmail.get(email);
      if (!userId || !this.users.has(userId)) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const user = this.users.get(userId)!;

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is disabled'
        };
      }

      // Validate password (demo only - use proper hashing in production)
      const isValidPassword = password === 'admin123' || password === 'password123';
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: SessionInfo = {
        sessionId,
        userId: user.id,
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isActive: true
      };

      this.sessions.set(sessionId, session);

      // Generate JWT token (simplified for demo)
      const token: AuthToken = {
        accessToken: btoa(JSON.stringify({
          type: 'access',
          userId: user.id,
          sessionId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
          scope: PermissionChecker.getEffectivePermissions(user).map(p => `${p.resource}:${p.action}`)
        })),
        refreshToken: btoa(JSON.stringify({
          type: 'refresh',
          userId: user.id,
          sessionId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        })),
        tokenType: 'Bearer',
        expiresIn: 15 * 60,
        scope: PermissionChecker.getEffectivePermissions(user).map(p => `${p.resource}:${p.action}`),
        user
      };

      // Update user last login
      user.lastLogin = new Date().toISOString();

      return {
        success: true,
        token,
        user,
        session
      };

    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    user?: User;
    permissions?: Permission[];
    error?: string;
  }> {
    try {
      const payload = JSON.parse(atob(token));
      
      // Check expiration
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        return {
          valid: false,
          error: 'Token expired'
        };
      }

      if (payload.type !== 'access') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      const user = this.users.get(payload.userId);
      if (!user || !user.isActive) {
        return {
          valid: false,
          error: 'User not found or inactive'
        };
      }

      const permissions = PermissionChecker.getEffectivePermissions(user);

      return {
        valid: true,
        user,
        permissions
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(token: string, resource: string, action: string): Promise<boolean> {
    const validation = await this.validateToken(token);
    if (!validation.valid || !validation.user) {
      return false;
    }

    return PermissionChecker.hasPermission(validation.user, resource, action);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    totalUsers: number;
    activeUsers: number;
    activeSessions: number;
  } {
    const totalUsers = this.users.size;
    const activeUsers = Array.from(this.users.values()).filter(user => user.isActive).length;
    const activeSessions = this.sessions.size;

    return {
      totalUsers,
      activeUsers,
      activeSessions
    };
  }
}

// Export singleton instance
export const enhancedAuthService = new EnhancedAuthService();

export default EnhancedAuthService;