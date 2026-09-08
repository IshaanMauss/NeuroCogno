import { SystemIssue } from '../models/SystemIssue.js';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';
import { logError } from '../services/errorTracking.js';
import { emitAdminUpdate } from '../services/realtime.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export async function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  // Log error with full context for developers
  const errorLog = await logError(err, req, {
    userAction: req.userAction,
    endpoint: `${req.method} ${req.path}`
  });

  logger.error(
    {
      err,
      errorId: errorLog?.errorId,
      path: req.originalUrl,
      method: req.method,
      requestId: req.id,
      file: errorLog?.file,
      line: errorLog?.line,
      category: errorLog?.category,
      severity: errorLog?.severity
    },
    'Request failed'
  );

  // Create system issue for critical errors
  if (status >= 500) {
    SystemIssue.create({
      type: 'server',
      severity: errorLog?.severity || 'high',
      title: err.message || 'Server error',
      message: `Error ID: ${errorLog?.errorId}\nLocation: ${errorLog?.file}:${errorLog?.line}\nCategory: ${errorLog?.category}`,
      metadata: {
        path: req.originalUrl,
        method: req.method,
        errorId: errorLog?.errorId,
        stack: isProduction ? undefined : err.stack,
        requestId: req.id
      }
    })
      .then((issue) => {
        // Previously nothing ever told the admin dashboard's socket listener
        // that a new issue exists ("system:issue" was listened for but never
        // emitted anywhere) — the Server & Payment Issues tab only ever
        // updated on a manual page reload. Fixed by emitting it here.
        emitAdminUpdate('system:issue', {
          issueId: issue._id,
          title: issue.title,
          severity: issue.severity,
          path: issue.path
        });
      })
      .catch((saveError) => logger.error({ err: saveError }, 'Failed to save system issue'));
  }

  // Response format
  const response = {
    error: true,
    message: status >= 500 ? 'An unexpected error occurred. Our team has been notified.' : err.message,
    errorId: errorLog?.errorId, // For tracking and support
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  // Include debug details in development
  if (!isProduction) {
    response.debug = {
      stack: err.stack,
      file: errorLog?.file,
      line: errorLog?.line,
      column: errorLog?.column,
      category: errorLog?.category,
      severity: errorLog?.severity
    };
  }

  res.status(status).json(response);
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Process-level error handlers
 */
export function setupProcessErrorHandlers() {
  // Unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Promise Rejection');

    await logError(new Error('Unhandled Promise Rejection: ' + reason), null, {
      type: 'unhandledRejection',
      reason: String(reason)
    });
  });

  // Uncaught exceptions
  process.on('uncaughtException', async (error) => {
    logger.error({ err: error }, 'Uncaught Exception');

    await logError(error, null, {
      type: 'uncaughtException',
      fatal: true
    });

    // Give time for logging, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}
