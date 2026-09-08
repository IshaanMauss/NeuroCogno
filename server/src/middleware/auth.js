import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';
import { User } from '../models/User.js';
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  verifyAccessToken,
  verifyRefreshToken,
  rotateTokens,
  accessCookieName,
  refreshCookieName
} from '../services/tokenManager.js';
import { logAudit } from '../services/auditLog.js';

// Export token functions for use in routes
export {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  accessCookieName,
  refreshCookieName
};

// Backward compatibility exports
export function setAuthCookie(res, accessToken, refreshToken) {
  if (refreshToken) {
    setAuthCookies(res, accessToken, refreshToken);
  } else {
    // Old style - just access token
    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 20 * 60 * 1000,
      signed: true,
      path: '/'
    });
  }
}

export function clearAuthCookie(res) {
  clearAuthCookies(res);
}

/**
 * Enhanced authentication middleware with audit logging
 */
export async function requireAuth(req, res, next) {
  try {
    const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const token = req.signedCookies?.[accessCookieName] || bearer;

    if (!token) {
      await logAudit({
        action: 'login_failed',
        resource: 'user',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        success: false,
        errorMessage: 'No authentication token provided',
        severity: 'warning'
      });
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify access token
    const result = verifyAccessToken(token);
    if (!result.valid) {
      await logAudit({
        action: 'login_failed',
        resource: 'user',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        success: false,
        errorMessage: result.error,
        severity: 'warning'
      });
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    const user = await User.findById(result.payload.sub).select('-passwordHash');

    if (!user || !user.isActive) {
      await logAudit({
        action: 'login_failed',
        resource: 'user',
        userId: result.payload.sub,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        success: false,
        errorMessage: 'User not found or inactive',
        severity: 'error'
      });
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = user;
    return next();
  } catch (error) {
    await logAudit({
      action: 'login_failed',
      resource: 'user',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      success: false,
      errorMessage: error.message,
      severity: 'error'
    });
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      await logAudit({
        action: 'security_violation',
        resource: 'user',
        userId: req.user?._id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        metadata: { requiredRoles: roles, userRole: req.user?.role },
        success: false,
        errorMessage: 'Insufficient permissions',
        severity: 'warning'
      });
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

/**
 * Optional authentication - attaches user if token is valid, but doesn't reject if missing
 */
export async function optionalAuth(req, res, next) {
  try {
    const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const token = req.signedCookies?.[accessCookieName] || bearer;

    if (!token) {
      return next();
    }

    const result = verifyAccessToken(token);
    if (result.valid) {
      const user = await User.findById(result.payload.sub).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }

    return next();
  } catch {
    return next();
  }
}
