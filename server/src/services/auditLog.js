/**
 * Audit Logging Service
 * Tracks all data changes and security events
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

const auditLogSchema = new mongoose.Schema({
  // Event metadata
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'read', 'update', 'delete',
      'login', 'logout', 'login_failed', 'token_refresh',
      'password_change', 'account_locked', 'account_unlocked',
      'payment_created', 'payment_verified', 'payment_failed',
      'lead_confirmed', 'lead_archived', 'lead_restored',
      'security_violation', 'rate_limit_exceeded', 'ip_blocked'
    ]
  },

  // Resource information
  resource: {
    type: String, // 'user', 'lead', 'payment', 'system'
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Actor information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: String,
  ip: String,
  userAgent: String,

  // Change details
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },

  // Context
  metadata: mongoose.Schema.Types.Mixed,
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },

  // Request details
  method: String,
  path: String,
  query: mongoose.Schema.Types.Mixed,

  // Outcome
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  collection: 'auditlogs'
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Log an audit event
 */
export async function logAudit({
  action,
  resource,
  resourceId,
  userId,
  userRole,
  ip,
  userAgent,
  changes,
  metadata,
  severity = 'info',
  method,
  path,
  query,
  success = true,
  errorMessage
}) {
  try {
    await AuditLog.create({
      action,
      resource,
      resourceId,
      userId,
      userRole,
      ip,
      userAgent,
      changes,
      metadata,
      severity,
      method,
      path,
      query,
      success,
      errorMessage,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create audit log');
  }
}

/**
 * Middleware to automatically audit requests
 */
export function auditMiddleware(options = {}) {
  return async (req, res, next) => {
    const { action, resource } = options;

    // Capture original body for comparison
    const originalBody = { ...req.body };

    // Intercept response to log after completion
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Log the audit event
      logAudit({
        action: action || inferAction(req.method),
        resource: resource || inferResource(req.path),
        resourceId: req.params.id || data?.item?._id || data?.id,
        userId: req.user?._id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        changes: {
          before: originalBody,
          after: data
        },
        metadata: {
          params: req.params,
          statusCode: res.statusCode
        },
        severity: res.statusCode >= 400 ? 'error' : 'info',
        method: req.method,
        path: req.path,
        query: req.query,
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? data?.message : undefined
      });

      return originalJson(data);
    };

    next();
  };
}

function inferAction(method) {
  const map = {
    POST: 'create',
    GET: 'read',
    PATCH: 'update',
    PUT: 'update',
    DELETE: 'delete'
  };
  return map[method] || 'unknown';
}

function inferResource(path) {
  if (path.includes('/leads')) return 'lead';
  if (path.includes('/payments')) return 'payment';
  if (path.includes('/users') || path.includes('/auth')) return 'user';
  if (path.includes('/admin')) return 'admin';
  return 'system';
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters = {}, options = {}) {
  const {
    userId,
    resource,
    resourceId,
    action,
    severity,
    startDate,
    endDate,
    limit = 100,
    skip = 0
  } = { ...filters, ...options };

  const query = {};

  if (userId) query.userId = userId;
  if (resource) query.resource = resource;
  if (resourceId) query.resourceId = resourceId;
  if (action) query.action = action;
  if (severity) query.severity = severity;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name username email role')
    .lean();
}

/**
 * Get audit trail for a specific resource
 */
export async function getResourceAuditTrail(resource, resourceId, limit = 50) {
  return await AuditLog.find({ resource, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name username email role')
    .lean();
}

/**
 * Get security events
 */
export async function getSecurityEvents(options = {}) {
  const { limit = 100, skip = 0, startDate, endDate } = options;

  const query = {
    $or: [
      { severity: { $in: ['error', 'critical'] } },
      { action: { $in: ['login_failed', 'account_locked', 'security_violation', 'rate_limit_exceeded', 'ip_blocked'] } }
    ]
  };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summary = await AuditLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return summary;
}

/**
 * Cleanup old audit logs (keep last N days)
 */
export async function cleanupOldAuditLogs(retentionDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await AuditLog.deleteMany({
    timestamp: { $lt: cutoffDate },
    severity: { $nin: ['critical'] } // Keep critical logs longer
  });

  logger.info({ deletedCount: result.deletedCount, cutoffDate }, 'Cleaned up old audit logs');
  return result.deletedCount;
}
