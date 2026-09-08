/**
 * Advanced Security Middleware
 * Implements comprehensive security controls for production deployment
 */

import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { emitAdminUpdate } from './../services/realtime.js';

// Track login attempts per IP and username
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Login attempt tracking and account lockout
 */
export function checkLoginAttempts(identifier, ip) {
  const key = `${identifier}:${ip}`;
  const now = Date.now();

  let attempts = loginAttempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  // Check if account is currently locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
    return {
      locked: true,
      remainingMinutes,
      message: `Account temporarily locked. Try again in ${remainingMinutes} minutes.`
    };
  }

  // Reset attempts if window has passed
  if (now - attempts.firstAttempt > ATTEMPT_WINDOW_MS) {
    attempts = { count: 0, firstAttempt: now, lockedUntil: null };
  }

  return { locked: false, attempts: attempts.count };
}

export function recordFailedLogin(identifier, ip) {
  const key = `${identifier}:${ip}`;
  const now = Date.now();

  let attempts = loginAttempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  // Reset if window passed
  if (now - attempts.firstAttempt > ATTEMPT_WINDOW_MS) {
    attempts = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    attempts.count++;
  }

  // Lock account if max attempts reached
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION_MS;

    // Log security event
    SystemIssue.create({
      type: 'security',
      severity: 'high',
      title: 'Account lockout triggered',
      message: `Multiple failed login attempts for ${identifier} from IP ${ip}`,
      metadata: { identifier, ip, attempts: attempts.count }
    })
      .then((issue) => emitAdminUpdate('system:issue', { issueId: issue._id, title: issue.title, severity: issue.severity }))
      .catch(err => logger.error({ err }, 'Failed to log security issue'));

    logger.warn({ identifier, ip, attempts: attempts.count }, 'Account locked due to failed login attempts');
  }

  loginAttempts.set(key, attempts);

  // Cleanup old entries every 1000 failed attempts
  if (loginAttempts.size > 1000) {
    cleanupOldAttempts();
  }
}

export function recordSuccessfulLogin(identifier, ip) {
  const key = `${identifier}:${ip}`;
  loginAttempts.delete(key);
}

function cleanupOldAttempts() {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > ATTEMPT_WINDOW_MS && (!data.lockedUntil || now > data.lockedUntil)) {
      loginAttempts.delete(key);
    }
  }
}

/**
 * CSRF Token Protection for state-changing operations
 */
export function csrfProtection() {
  return (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for webhook endpoints (they use signature verification)
    if (req.path.includes('/webhook')) {
      return next();
    }

    const token = req.get('X-CSRF-Token') || req.body._csrf;
    const sessionToken = req.signedCookies?.csrf_token;

    if (!token || !sessionToken || token !== sessionToken) {
      logger.warn({ path: req.path, ip: req.ip }, 'CSRF token validation failed');
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    next();
  };
}

/**
 * Generate CSRF token for session
 */
export function generateCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    signed: true
  });
  return token;
}

/**
 * Request signature verification for critical operations
 */
export function verifyRequestSignature(secret) {
  return (req, res, next) => {
    const signature = req.get('X-Request-Signature');
    const timestamp = req.get('X-Request-Timestamp');
    const nonce = req.get('X-Request-Nonce');

    if (!signature || !timestamp || !nonce) {
      return res.status(401).json({ message: 'Missing signature headers' });
    }

    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) { // 5 minutes window
      return res.status(401).json({ message: 'Request timestamp expired' });
    }

    // Verify signature
    const payload = `${req.method}:${req.originalUrl}:${timestamp}:${nonce}:${JSON.stringify(req.body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn({ path: req.path, ip: req.ip }, 'Request signature verification failed');
      return res.status(401).json({ message: 'Invalid request signature' });
    }

    next();
  };
}

/**
 * Idempotency key handler for payment operations
 */
const idempotencyStore = new Map();

export function idempotencyMiddleware() {
  return (req, res, next) => {
    const key = req.get('Idempotency-Key');

    if (!key) {
      return res.status(400).json({ message: 'Idempotency-Key header required' });
    }

    // Check if we've seen this key before
    const cached = idempotencyStore.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;

      // If request is still processing, return 409
      if (!cached.response) {
        return res.status(409).json({ message: 'Request already processing' });
      }

      // If request completed, return cached response
      if (age < 24 * 60 * 60 * 1000) { // 24 hours
        logger.info({ key }, 'Returning cached idempotent response');
        return res.status(cached.statusCode).json(cached.response);
      }

      // Expired, remove from cache
      idempotencyStore.delete(key);
    }

    // Mark as processing
    idempotencyStore.set(key, { timestamp: Date.now(), response: null });

    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      idempotencyStore.set(key, {
        timestamp: Date.now(),
        statusCode: res.statusCode,
        response: data
      });

      // Cleanup old entries
      if (idempotencyStore.size > 10000) {
        cleanupIdempotencyStore();
      }

      return originalJson(data);
    };

    next();
  };
}

function cleanupIdempotencyStore() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;

  for (const [key, data] of idempotencyStore.entries()) {
    if (now - data.timestamp > maxAge) {
      idempotencyStore.delete(key);
    }
  }
}

/**
 * Sanitize response to prevent data leakage
 */
export function sanitizeResponse() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Remove sensitive fields from response
      const sanitized = sanitizeObject(data);
      return originalJson(sanitized);
    };

    next();
  };
}

function sanitizeObject(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Buffer.isBuffer(obj)) return '[buffer]';
  if (obj._bsontype === 'ObjectId' && typeof obj.toString === 'function') return obj.toString();
  if (typeof obj.toObject === 'function') return sanitizeObject(obj.toObject({ depopulate: true }), seen);
  if (seen.has(obj)) return undefined;
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, seen));
  }

  const sensitiveFields = [
    'passwordHash',
    'password',
    '__v',
    'providerSignature',
    'rawWebhookEvent'
  ];

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!sensitiveFields.includes(key)) {
      const cleanValue = sanitizeObject(value, seen);
      if (cleanValue !== undefined) sanitized[key] = cleanValue;
    }
  }

  return sanitized;
}

/**
 * IP Whitelist/Blacklist middleware
 */
const ipBlacklist = new Set();
const ipWhitelist = new Set();

export function ipFilter() {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress;

    // Check blacklist
    if (ipBlacklist.has(ip)) {
      logger.warn({ ip, path: req.path }, 'Blocked request from blacklisted IP');
      return res.status(403).json({ message: 'Access denied' });
    }

    // If whitelist is active, check it
    if (ipWhitelist.size > 0 && !ipWhitelist.has(ip)) {
      logger.warn({ ip, path: req.path }, 'Blocked request from non-whitelisted IP');
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
}

export function addToBlacklist(ip) {
  ipBlacklist.add(ip);
  logger.info({ ip }, 'IP added to blacklist');
}

export function addToWhitelist(ip) {
  ipWhitelist.add(ip);
  logger.info({ ip }, 'IP added to whitelist');
}

/**
 * Detect and prevent suspicious patterns
 */
const suspiciousPatterns = [
  /(\.\.|\/etc\/|\/proc\/|\.\.\/)/i, // Path traversal
  /(union.*select|insert.*into|drop.*table)/i, // SQL injection
  /(<script|javascript:|onerror=|onload=)/i, // XSS
  /(exec\(|eval\(|system\()/i // Code injection
];

export function detectSuspiciousPatterns() {
  return (req, res, next) => {
    const checkString = JSON.stringify({
      url: req.originalUrl,
      query: req.query,
      body: req.body
    });

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        logger.error({
          ip: req.ip,
          path: req.path,
          pattern: pattern.toString()
        }, 'Suspicious pattern detected');

        SystemIssue.create({
          type: 'security',
          severity: 'critical',
          title: 'Potential attack detected',
          message: `Suspicious pattern detected from IP ${req.ip} on ${req.path}`,
          metadata: { ip: req.ip, path: req.path, pattern: pattern.toString() }
        })
          .then((issue) => emitAdminUpdate('system:issue', { issueId: issue._id, title: issue.title, severity: issue.severity }))
          .catch(err => logger.error({ err }, 'Failed to log security issue'));

        addToBlacklist(req.ip);

        return res.status(403).json({ message: 'Request blocked' });
      }
    }

    next();
  };
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Cleanup intervals
setInterval(cleanupOldAttempts, 60 * 60 * 1000); // Every hour
setInterval(cleanupIdempotencyStore, 60 * 60 * 1000); // Every hour
