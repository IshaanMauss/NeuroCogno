/**
 * Developer Debugging Routes
 * Advanced error tracking and performance monitoring
 */

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  ErrorLog,
  getErrorStatistics,
  resolveError
} from '../services/errorTracking.js';
import { getResourceAuditTrail, queryAuditLogs } from '../services/auditLog.js';

export const devRoutes = express.Router();

// Only accessible to developers
devRoutes.use(requireAuth, requireRole('developer'));

/**
 * Get error dashboard statistics
 */
devRoutes.get('/errors/dashboard', asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || '24h';
  const stats = await getErrorStatistics(timeframe);

  res.json({
    timeframe,
    stats
  });
}));

/**
 * Get all error logs with filtering
 */
devRoutes.get('/errors', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    severity,
    category,
    resolved,
    search
  } = req.query;

  const query = {};

  if (severity) query.severity = severity;
  if (category) query.category = category;
  if (resolved !== undefined) query.resolved = resolved === 'true';
  if (search) {
    query.$or = [
      { message: new RegExp(search, 'i') },
      { errorId: new RegExp(search, 'i') },
      { file: new RegExp(search, 'i') }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [errors, total] = await Promise.all([
    ErrorLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name username email role')
      .populate('resolvedBy', 'name username')
      .lean(),
    ErrorLog.countDocuments(query)
  ]);

  res.json({
    errors,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * Get specific error details
 */
devRoutes.get('/errors/:errorId', asyncHandler(async (req, res) => {
  const error = await ErrorLog.findOne({ errorId: req.params.errorId })
    .populate('userId', 'name username email role')
    .populate('resolvedBy', 'name username')
    .lean();

  if (!error) {
    return res.status(404).json({ message: 'Error not found' });
  }

  // Find similar errors
  const similarErrors = await ErrorLog.find({
    fingerprint: error.fingerprint,
    errorId: { $ne: error.errorId }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('errorId message occurrenceCount createdAt resolved')
    .lean();

  res.json({
    error,
    similarErrors
  });
}));

/**
 * Mark error as resolved
 */
devRoutes.post('/errors/:errorId/resolve', asyncHandler(async (req, res) => {
  const { resolution } = req.body;

  if (!resolution) {
    return res.status(400).json({ message: 'Resolution description required' });
  }

  const error = await resolveError(
    req.params.errorId,
    resolution,
    req.user._id
  );

  if (!error) {
    return res.status(404).json({ message: 'Error not found' });
  }

  res.json({ error });
}));

/**
 * Reopen resolved error
 */
devRoutes.post('/errors/:errorId/reopen', asyncHandler(async (req, res) => {
  const error = await ErrorLog.findOneAndUpdate(
    { errorId: req.params.errorId },
    {
      $set: {
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        resolution: null
      }
    },
    { new: true }
  );

  if (!error) {
    return res.status(404).json({ message: 'Error not found' });
  }

  res.json({ error });
}));

/**
 * Get errors by category
 */
devRoutes.get('/errors/category/:category', asyncHandler(async (req, res) => {
  const errors = await ErrorLog.find({
    category: req.params.category,
    resolved: false
  })
    .sort({ occurrenceCount: -1, createdAt: -1 })
    .limit(50)
    .select('errorId message file line occurrenceCount severity createdAt')
    .lean();

  res.json({ errors });
}));

/**
 * Get errors by severity
 */
devRoutes.get('/errors/severity/:severity', asyncHandler(async (req, res) => {
  const errors = await ErrorLog.find({
    severity: req.params.severity,
    resolved: false
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .select('errorId message category file line occurrenceCount createdAt')
    .lean();

  res.json({ errors });
}));

/**
 * Get system performance metrics
 */
devRoutes.get('/performance', asyncHandler(async (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) + '%'
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000) + ' ms',
      system: Math.round(cpuUsage.system / 1000) + ' ms'
    },
    uptime: {
      seconds: Math.round(process.uptime()),
      formatted: formatUptime(process.uptime())
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
}));

/**
 * Get audit logs for debugging
 */
devRoutes.get('/audit-logs', asyncHandler(async (req, res) => {
  const {
    userId,
    resource,
    action,
    startDate,
    endDate,
    limit = 100,
    skip = 0
  } = req.query;

  const logs = await queryAuditLogs({
    userId,
    resource,
    action,
    startDate,
    endDate,
    limit: parseInt(limit),
    skip: parseInt(skip)
  });

  res.json({ logs });
}));

/**
 * Get recent critical events
 */
devRoutes.get('/critical-events', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  const [criticalErrors, securityEvents] = await Promise.all([
    ErrorLog.find({ severity: 'critical', resolved: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('errorId message category file line occurrenceCount createdAt')
      .lean(),

    queryAuditLogs({
      action: {
        $in: ['login_failed', 'security_violation', 'account_locked', 'rate_limit_exceeded']
      },
      limit: limit
    })
  ]);

  res.json({
    criticalErrors,
    securityEvents
  });
}));

/**
 * Search errors by message or file
 */
devRoutes.get('/errors/search', asyncHandler(async (req, res) => {
  const { q, limit = 50 } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Search query required' });
  }

  const errors = await ErrorLog.find({
    $or: [
      { message: new RegExp(q, 'i') },
      { file: new RegExp(q, 'i') },
      { stack: new RegExp(q, 'i') }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('errorId message file line category severity occurrenceCount createdAt resolved')
    .lean();

  res.json({ errors, count: errors.length });
}));

/**
 * Get database connection info
 */
devRoutes.get('/database/status', asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const db = mongoose.connection;

  res.json({
    status: db.readyState === 1 ? 'connected' : 'disconnected',
    readyState: db.readyState,
    host: db.host,
    port: db.port,
    name: db.name,
    collections: Object.keys(db.collections),
    models: Object.keys(mongoose.models)
  });
}));

/**
 * Helper: Format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export default devRoutes;
