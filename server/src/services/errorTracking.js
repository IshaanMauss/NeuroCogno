/**
 * Advanced Error Tracking and Debugging Service
 * Provides detailed error logging with context for developers
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { emitAdminUpdate } from './realtime.js';

const errorLogSchema = new mongoose.Schema({
  // Error identification
  errorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Error details
  message: {
    type: String,
    required: true
  },
  stack: String,
  name: String,
  code: String,

  // Location information
  file: String,
  function: String,
  line: Number,
  column: Number,

  // Request context
  request: {
    method: String,
    url: String,
    path: String,
    query: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String
  },

  // User context
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: String,
  sessionId: String,

  // System context
  environment: {
    nodeEnv: String,
    nodeVersion: String,
    platform: String,
    memory: {
      used: Number,
      total: Number,
      percentage: Number
    },
    cpu: mongoose.Schema.Types.Mixed,
    uptime: Number
  },

  // Database context (if DB error)
  database: {
    operation: String,
    collection: String,
    query: mongoose.Schema.Types.Mixed,
    errorCode: Number
  },

  // API context (if external API error)
  externalApi: {
    service: String,
    endpoint: String,
    statusCode: Number,
    responseTime: Number
  },

  // Error severity and categorization
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    enum: [
      'validation',
      'authentication',
      'authorization',
      'database',
      'payment',
      'external_api',
      'system',
      'network',
      'unknown'
    ],
    default: 'unknown',
    index: true
  },

  // Resolution tracking
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,

  // Occurrence tracking
  firstOccurrence: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastOccurrence: {
    type: Date,
    default: Date.now
  },
  occurrenceCount: {
    type: Number,
    default: 1
  },

  // Similar errors
  fingerprint: {
    type: String,
    index: true
  },

  // Additional context
  metadata: mongoose.Schema.Types.Mixed,
  tags: [String]

}, {
  timestamps: true,
  collection: 'errorlogs'
});

// Indexes for efficient querying
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ severity: 1, resolved: 1, createdAt: -1 });
errorLogSchema.index({ category: 1, createdAt: -1 });
errorLogSchema.index({ fingerprint: 1, resolved: 1 });
errorLogSchema.index({ userId: 1, createdAt: -1 });

export const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

/**
 * Generate error fingerprint for grouping similar errors
 */
function generateErrorFingerprint(error, req) {
  const components = [
    error.name || 'Error',
    error.message?.split(':')[0] || 'unknown',
    req?.path || 'no-path',
    error.code || ''
  ];

  return crypto.createHash('md5').update(components.join('|')).digest('hex');
}

/**
 * Extract stack trace location
 */
function parseStackTrace(stack) {
  if (!stack) return {};

  const lines = stack.split('\n');
  const match = lines[1]?.match(/\((.*):(\d+):(\d+)\)/) ||
                lines[1]?.match(/at (.*):(\d+):(\d+)/);

  if (match) {
    return {
      file: match[1]?.replace(process.cwd(), ''),
      line: parseInt(match[2]),
      column: parseInt(match[3])
    };
  }

  return {};
}

/**
 * Categorize error automatically
 */
function categorizeError(error, req) {
  // Check error message and type
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  if (name.includes('validation') || message.includes('validation')) {
    return 'validation';
  }
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 'authentication';
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'authorization';
  }
  if (name.includes('mongo') || message.includes('database') || message.includes('mongodb')) {
    return 'database';
  }
  if (req?.path?.includes('/payment') || message.includes('razorpay')) {
    return 'payment';
  }
  if (message.includes('fetch') || message.includes('axios') || message.includes('request')) {
    return 'external_api';
  }
  if (message.includes('econnrefused') || message.includes('network')) {
    return 'network';
  }
  if (message.includes('memory') || message.includes('cpu')) {
    return 'system';
  }

  return 'unknown';
}

/**
 * Determine error severity
 */
function determineSeverity(error, req) {
  const message = (error.message || '').toLowerCase();
  const statusCode = error.statusCode || error.status || 500;

  // Critical errors
  if (message.includes('payment') && message.includes('failed')) return 'critical';
  if (message.includes('database') && message.includes('connection')) return 'critical';
  if (message.includes('unauthorized') && message.includes('admin')) return 'critical';
  if (statusCode === 500) return 'critical';

  // High severity
  if (statusCode === 503 || statusCode === 504) return 'high';
  if (message.includes('timeout')) return 'high';
  if (message.includes('signature') && message.includes('failed')) return 'high';

  // Medium severity
  if (statusCode >= 400 && statusCode < 500) return 'medium';

  return 'low';
}

/**
 * Get system context
 */
function getSystemContext() {
  const memUsage = process.memoryUsage();

  return {
    nodeEnv: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: process.cpuUsage(),
    uptime: Math.round(process.uptime())
  };
}

/**
 * Log error with full context
 */
export async function logError(error, req = null, additionalContext = {}) {
  try {
    const errorId = crypto.randomBytes(8).toString('hex');
    const fingerprint = generateErrorFingerprint(error, req);
    const location = parseStackTrace(error.stack);
    const category = categorizeError(error, req);
    const severity = determineSeverity(error, req);

    // Check if similar error exists (same fingerprint, unresolved, within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const similarError = await ErrorLog.findOne({
      fingerprint,
      resolved: false,
      lastOccurrence: { $gte: oneHourAgo }
    });

    if (similarError) {
      // Update existing error
      similarError.lastOccurrence = new Date();
      similarError.occurrenceCount += 1;
      await similarError.save();

      logger.warn({
        errorId: similarError.errorId,
        occurrenceCount: similarError.occurrenceCount
      }, 'Recurring error detected');

      return similarError;
    }

    // Create new error log
    const errorLog = await ErrorLog.create({
      errorId,
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name || 'Error',
      code: error.code,

      file: location.file,
      line: location.line,
      column: location.column,
      function: error.function,

      request: req ? {
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        query: sanitizeObject(req.query),
        params: req.params,
        body: sanitizeObject(req.body),
        headers: sanitizeHeaders(req.headers),
        ip: req.ip,
        userAgent: req.get('user-agent')
      } : null,

      userId: req?.user?._id,
      userRole: req?.user?.role,
      sessionId: req?.sessionID,

      environment: getSystemContext(),

      database: error.name?.includes('Mongo') ? {
        operation: error.operation,
        collection: error.collection,
        query: sanitizeObject(error.query),
        errorCode: error.code
      } : null,

      externalApi: additionalContext.externalApi,

      severity,
      category,
      fingerprint,

      metadata: {
        ...additionalContext,
        timestamp: new Date().toISOString()
      },

      tags: generateTags(error, req, category, severity)
    });

    // Log to console for immediate developer visibility
    logger.error({
      errorId,
      message: error.message,
      file: location.file,
      line: location.line,
      category,
      severity,
      path: req?.path
    }, 'Error logged');

    // Alert on critical errors
    if (severity === 'critical') {
      await alertCriticalError(errorLog);
    }

    return errorLog;

  } catch (logError) {
    // Fallback logging if error logging fails
    logger.error({ err: logError }, 'Failed to log error to database');
    logger.error({ err: error }, 'Original error that failed to log');
  }
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = [
    'password', 'passwordHash', 'token', 'secret', 'apiKey',
    'authorization', 'cookie', 'csrf', 'razorpay_signature'
  ];

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(sk => keyLower.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize headers
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token'];

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Generate tags for error
 */
function generateTags(error, req, category, severity) {
  const tags = [category, severity];

  if (req?.user) tags.push('authenticated');
  if (req?.path?.includes('/admin')) tags.push('admin');
  if (req?.path?.includes('/payment')) tags.push('payment');
  if (error.name) tags.push(error.name.toLowerCase());

  return tags;
}

/**
 * Alert on critical errors
 */
async function alertCriticalError(errorLog) {
  // Create system issue for admin dashboard.
  // BUG FIXED: this used to do `const { SystemIssue } = require('../models/SystemIssue.js')`
  // inside an ES module, which throws "ReferenceError: require is not defined" every single
  // time a critical-severity error occurred. That threw synchronously before the SystemIssue
  // was ever created, was swallowed by the caller's try/catch, and meant the detailed
  // ErrorLog record for every critical error silently failed to save (logError() bailed out
  // of its own try block and returned undefined). Also fixed: 'system' is not a valid
  // SystemIssue.type enum value (['server','payment','database','api','security']), which
  // would have thrown a Mongoose ValidationError even with require() fixed.
  const issue = await SystemIssue.create({
    type: 'server',
    severity: 'critical',
    title: `Critical Error: ${errorLog.message}`,
    message: `Error ID: ${errorLog.errorId}\nLocation: ${errorLog.file}:${errorLog.line}\nCategory: ${errorLog.category}`,
    metadata: {
      errorId: errorLog.errorId,
      category: errorLog.category
    }
  });
  emitAdminUpdate('system:issue', { issueId: issue._id, title: issue.title, severity: issue.severity });

  // TODO: Send email/SMS alert to developers
  logger.error({ errorId: errorLog.errorId }, 'CRITICAL ERROR ALERT');
}

/**
 * Get error statistics
 */
export async function getErrorStatistics(timeframe = '24h') {
  const timeMap = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  };

  const hours = timeMap[timeframe] || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const stats = await ErrorLog.aggregate([
    {
      $match: {
        createdAt: { $gte: since }
      }
    },
    {
      $facet: {
        bySeverity: [
          { $group: { _id: '$severity', count: { $sum: '$occurrenceCount' } } },
          { $sort: { count: -1 } }
        ],
        byCategory: [
          { $group: { _id: '$category', count: { $sum: '$occurrenceCount' } } },
          { $sort: { count: -1 } }
        ],
        topErrors: [
          { $match: { resolved: false } },
          { $sort: { occurrenceCount: -1 } },
          { $limit: 10 },
          {
            $project: {
              errorId: 1,
              message: 1,
              category: 1,
              severity: 1,
              occurrenceCount: 1,
              file: 1,
              line: 1
            }
          }
        ],
        summary: [
          {
            $group: {
              _id: null,
              totalErrors: { $sum: 1 },
              totalOccurrences: { $sum: '$occurrenceCount' },
              unresolvedErrors: {
                $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] }
              },
              criticalErrors: {
                $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
              }
            }
          }
        ]
      }
    }
  ]);

  return stats[0];
}

/**
 * Mark error as resolved
 */
export async function resolveError(errorId, resolution, resolvedBy) {
  const errorLog = await ErrorLog.findOneAndUpdate(
    { errorId },
    {
      $set: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolution
      }
    },
    { new: true }
  );

  if (errorLog) {
    logger.info({ errorId, resolvedBy }, 'Error marked as resolved');
  }

  return errorLog;
}

/**
 * Clean up old resolved errors
 */
export async function cleanupOldErrors(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await ErrorLog.deleteMany({
    resolved: true,
    resolvedAt: { $lt: cutoffDate }
  });

  logger.info({ deletedCount: result.deletedCount }, 'Cleaned up old error logs');
  return result.deletedCount;
}

// Auto cleanup every day
setInterval(() => cleanupOldErrors(), 24 * 60 * 60 * 1000);
