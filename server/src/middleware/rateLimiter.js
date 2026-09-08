/**
 * Advanced Rate Limiting Configuration
 * Different limits for different endpoint types
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { emitAdminUpdate } from '../services/realtime.js';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip;

    logger.error({ ip, path: req.path }, 'Auth rate limit exceeded - potential brute force');

    // Log as security issue
    SystemIssue.create({
      type: 'security',
      severity: 'critical',
      title: 'Authentication rate limit exceeded',
      message: `Possible brute force attack from IP ${ip}`,
      metadata: { ip, path: req.path, limit: 10 }
    })
      .then((issue) => emitAdminUpdate('system:issue', { issueId: issue._id, title: issue.title, severity: issue.severity }))
      .catch(err => logger.error({ err }, 'Failed to log security issue'));

    res.status(429).json({
      message: 'Too many login attempts. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Payment endpoint rate limiter
 */
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 payment operations per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP and user ID if authenticated
    return req.user ? `${req.ip}:${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, userId: req.user?._id }, 'Payment rate limit exceeded');
    res.status(429).json({
      message: 'Too many payment requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Public form submission rate limiter
 */
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 form submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Form submission rate limit exceeded');
    res.status(429).json({
      message: 'Too many form submissions. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Admin operations rate limiter
 */
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 900, // dashboard reads several panels; still blocks abusive loops
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `admin:${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    logger.warn({ userId: req.user?._id, ip: req.ip }, 'Admin rate limit exceeded');
    res.status(429).json({
      message: 'Too many admin operations. Please slow down.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Webhook rate limiter (lenient but tracked)
 */
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 webhook calls per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error({ ip: req.ip, path: req.path }, 'Webhook rate limit exceeded - possible attack');

    SystemIssue.create({
      type: 'security',
      severity: 'high',
      title: 'Webhook rate limit exceeded',
      message: `Excessive webhook requests from IP ${req.ip}`,
      metadata: { ip: req.ip }
    })
      .then((issue) => emitAdminUpdate('system:issue', { issueId: issue._id, title: issue.title, severity: issue.severity }))
      .catch(err => logger.error({ err }, 'Failed to log security issue'));

    res.status(429).json({ message: 'Rate limit exceeded' });
  }
});
