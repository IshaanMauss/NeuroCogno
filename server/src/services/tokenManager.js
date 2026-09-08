/**
 * Refresh Token Management
 * Implements secure session management with access and refresh tokens
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env, isProduction } from '../config/env.js';
import { logger } from '../config/logger.js';

// Store refresh tokens in memory (use Redis in production for distributed systems)
const refreshTokenStore = new Map();
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const ACCESS_TOKEN_EXPIRY = '20m';
const accessCookieName = 'nc_access';
const refreshCookieName = 'nc_refresh';

/**
 * Generate access token (short-lived)
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      type: 'access'
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'neurocogno',
      audience: 'neurocogno-api'
    }
  );
}

/**
 * Generate refresh token (long-lived)
 */
export function signRefreshToken(user) {
  const tokenId = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      jti: tokenId, // JWT ID for token revocation
      type: 'refresh'
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: 'neurocogno',
      audience: 'neurocogno-api'
    }
  );

  // Store refresh token metadata
  refreshTokenStore.set(tokenId, {
    userId: user._id.toString(),
    issuedAt: Date.now(),
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRY,
    revoked: false
  });

  return { token, tokenId };
}

/**
 * Set authentication cookies (access + refresh)
 */
export function setAuthCookies(res, accessToken, refreshToken) {
  // Access token cookie (short-lived)
  res.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 20 * 60 * 1000, // 20 minutes
    signed: true,
    path: '/'
  });

  // Refresh token cookie (long-lived)
  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY,
    signed: true,
    path: '/api/auth' // Only sent to auth endpoints
  });
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(res) {
  res.clearCookie(accessCookieName, { path: '/' });
  res.clearCookie(refreshCookieName, { path: '/api/auth' });
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'neurocogno',
      audience: 'neurocogno-api'
    });

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'neurocogno',
      audience: 'neurocogno-api'
    });

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if token is revoked
    const tokenData = refreshTokenStore.get(payload.jti);
    if (!tokenData || tokenData.revoked) {
      return { valid: false, error: 'Token revoked' };
    }

    // Check expiry from store
    if (Date.now() > tokenData.expiresAt) {
      refreshTokenStore.delete(payload.jti);
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload, tokenId: payload.jti };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Revoke a refresh token
 */
export function revokeRefreshToken(tokenId) {
  const tokenData = refreshTokenStore.get(tokenId);
  if (tokenData) {
    tokenData.revoked = true;
    refreshTokenStore.set(tokenId, tokenData);
    logger.info({ tokenId }, 'Refresh token revoked');
    return true;
  }
  return false;
}

/**
 * Revoke all refresh tokens for a user
 */
export function revokeAllUserTokens(userId) {
  let revokedCount = 0;
  for (const [tokenId, data] of refreshTokenStore.entries()) {
    if (data.userId === userId.toString()) {
      data.revoked = true;
      refreshTokenStore.set(tokenId, data);
      revokedCount++;
    }
  }
  logger.info({ userId, revokedCount }, 'All user tokens revoked');
  return revokedCount;
}

/**
 * Cleanup expired tokens (run periodically)
 */
export function cleanupExpiredTokens() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [tokenId, data] of refreshTokenStore.entries()) {
    if (now > data.expiresAt || data.revoked) {
      refreshTokenStore.delete(tokenId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.info({ cleanedCount }, 'Cleaned up expired refresh tokens');
  }

  return cleanedCount;
}

/**
 * Get active token count for a user
 */
export function getUserActiveTokenCount(userId) {
  const now = Date.now();
  let count = 0;

  for (const [, data] of refreshTokenStore.entries()) {
    if (data.userId === userId.toString() && !data.revoked && now <= data.expiresAt) {
      count++;
    }
  }

  return count;
}

/**
 * Token rotation on refresh
 * Returns new access token and optionally new refresh token
 */
export function rotateTokens(user, oldRefreshTokenId) {
  // Revoke old refresh token
  revokeRefreshToken(oldRefreshTokenId);

  // Generate new tokens
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);

  return { accessToken, refreshToken };
}

// Cleanup expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Export for backward compatibility
export { accessCookieName, refreshCookieName };
