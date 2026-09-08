/**
 * Enhanced Public Routes with Security
 */

import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimiter.js';
import { Lead } from '../models/Lead.js';
import { VisitorEvent } from '../models/VisitorEvent.js';
import { emitAdminUpdate } from '../services/realtime.js';
import { logAudit } from '../services/auditLog.js';

export const publicRoutes = express.Router();

// Apply form rate limiting to submission endpoints
publicRoutes.post('/leads', formLimiter);
publicRoutes.post('/visitor-events', formLimiter);

/**
 * Lead submission with security validation
 */
publicRoutes.post(
  '/leads',
  asyncHandler(async (req, res) => {
    // Server-side data sanitization
    const sanitizedData = {
      name: String(req.body.name || '').trim().slice(0, 100),
      phone: String(req.body.phone || '').trim().slice(0, 20),
      email: String(req.body.email || '').trim().toLowerCase().slice(0, 100),
      preferredDate: req.body.preferredDate,
      preferredTime: req.body.preferredTime,
      reason: String(req.body.reason || '').trim().slice(0, 500),
      source: req.body.source || 'unknown',
      status: req.body.status || 'draft'
    };

    // Validate email format if provided
    if (sanitizedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone format if provided
    if (sanitizedData.phone && !/^[+]?[\d\s\-()]{7,20}$/.test(sanitizedData.phone)) {
      return res.status(400).json({ message: 'Invalid phone format' });
    }

    const lead = await Lead.create({
      ...sanitizedData,
      lastDraftAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await logAudit({
      action: 'create',
      resource: 'lead',
      resourceId: lead._id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { source: sanitizedData.source, status: sanitizedData.status },
      severity: 'info',
      success: true
    });

    emitAdminUpdate('lead:created', { leadId: lead._id });

    res.status(201).json({ id: lead._id });
  })
);

/**
 * Visitor event tracking with rate limiting
 */
publicRoutes.post(
  '/visitor-events',
  asyncHandler(async (req, res) => {
    const sanitizedData = {
      eventType: String(req.body.eventType || '').trim().slice(0, 50),
      page: String(req.body.page || '').trim().slice(0, 200),
      section: String(req.body.section || '').trim().slice(0, 100),
      metadata: req.body.metadata || {}
    };

    await VisitorEvent.create({
      ...sanitizedData,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });

    res.json({ ok: true });
  })
);

export default publicRoutes;
