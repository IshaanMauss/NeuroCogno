import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../utils/validators.js';
import {
  clearAuthCookies,
  requireAuth,
  setAuthCookies,
  signAccessToken,
  signRefreshToken
} from '../middleware/auth.js';
import {
  verifyRefreshToken,
  rotateTokens,
  revokeAllUserTokens,
  getUserActiveTokenCount
} from '../services/tokenManager.js';
import {
  checkLoginAttempts,
  recordFailedLogin,
  recordSuccessfulLogin,
  generateCsrfToken
} from '../middleware/security.js';
import { logAudit } from '../services/auditLog.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { User } from '../models/User.js';

export const authRoutes = express.Router();

// Apply strict rate limiting to auth endpoints
authRoutes.use(authLimiter);

/**
 * Login endpoint with enhanced security
 */
authRoutes.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const identifier = (req.body.identifier || req.body.email || '').toLowerCase();
    const ip = req.ip;

    // Check for account lockout
    const lockStatus = checkLoginAttempts(identifier, ip);
    if (lockStatus.locked) {
      await logAudit({
        action: 'account_locked',
        resource: 'user',
        ip,
        userAgent: req.get('user-agent'),
        metadata: { identifier, remainingMinutes: lockStatus.remainingMinutes },
        severity: 'warning',
        success: false,
        errorMessage: lockStatus.message
      });

      return res.status(429).json({ message: lockStatus.message });
    }

    // Find user
    const user = await User.findOne({
      isActive: true,
      $or: [{ email: identifier }, { username: identifier }]
    });

    // Verify password
    if (!user || !(await user.comparePassword(req.body.password))) {
      recordFailedLogin(identifier, ip);

      await logAudit({
        action: 'login_failed',
        resource: 'user',
        userId: user?._id,
        ip,
        userAgent: req.get('user-agent'),
        metadata: { identifier },
        severity: 'warning',
        success: false,
        errorMessage: 'Invalid credentials'
      });

      return res.status(401).json({ message: 'Invalid ID/email or password' });
    }

    // Successful login
    recordSuccessfulLogin(identifier, ip);

    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = signAccessToken(user);
    const { token: refreshToken } = signRefreshToken(user);

    // Set auth cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Generate CSRF token
    const csrfToken = generateCsrfToken(res);

    // Log successful login
    await logAudit({
      action: 'login',
      resource: 'user',
      userId: user._id,
      userRole: user.role,
      ip,
      userAgent: req.get('user-agent'),
      metadata: { identifier },
      severity: 'info',
      success: true
    });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      csrfToken,
      activeSessionCount: getUserActiveTokenCount(user._id)
    });
  })
);

/**
 * Refresh token endpoint
 */
authRoutes.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.signedCookies?.nc_refresh;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const result = verifyRefreshToken(refreshToken);
    if (!result.valid) {
      await logAudit({
        action: 'token_refresh',
        resource: 'user',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        errorMessage: result.error,
        severity: 'warning'
      });

      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user
    const user = await User.findById(result.payload.sub).select('-passwordHash');
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'User not found' });
    }

    // Rotate tokens
    const { accessToken, refreshToken: newRefreshToken } = rotateTokens(user, result.tokenId);

    // Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    // Log token refresh
    await logAudit({
      action: 'token_refresh',
      resource: 'user',
      userId: user._id,
      userRole: user.role,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'info',
      success: true
    });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  })
);

/**
 * Logout endpoint
 */
authRoutes.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  // Revoke all user tokens
  const revokedCount = revokeAllUserTokens(req.user._id);

  clearAuthCookies(res);

  await logAudit({
    action: 'logout',
    resource: 'user',
    userId: req.user._id,
    userRole: req.user.role,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata: { revokedTokens: revokedCount },
    severity: 'info',
    success: true
  });

  res.json({ ok: true });
}));

/**
 * Get current user
 */
authRoutes.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      lastLoginAt: req.user.lastLoginAt
    },
    activeSessionCount: getUserActiveTokenCount(req.user._id)
  });
});

/**
 * Revoke all sessions (logout from all devices)
 */
authRoutes.post('/revoke-all', requireAuth, asyncHandler(async (req, res) => {
  const revokedCount = revokeAllUserTokens(req.user._id);

  clearAuthCookies(res);

  await logAudit({
    action: 'logout',
    resource: 'user',
    userId: req.user._id,
    userRole: req.user.role,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata: { revokedTokens: revokedCount, allDevices: true },
    severity: 'info',
    success: true
  });

  res.json({ ok: true, revokedSessions: revokedCount });
}));
