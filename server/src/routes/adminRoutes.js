import express from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { Lead } from '../models/Lead.js';
import { Payment } from '../models/Payment.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { VisitorEvent } from '../models/VisitorEvent.js';
import { SiteContent } from '../models/SiteContent.js';
import { getDashboardMetrics } from '../services/metrics.js';
import { validate } from '../middleware/validate.js';
import { adminLeadUpdateSchema, leadActionSchema, siteContentSchema, siteContentUpdateSchema, siteMediaUploadSchema } from '../utils/validators.js';
import { emitAdminUpdate, emitPublicUpdate } from '../services/realtime.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { auditMiddleware, getResourceAuditTrail } from '../services/auditLog.js';
import { collectBackupData, buildBackupWorkbook } from '../services/backupService.js';
import { cloudinaryConfigured } from '../config/env.js';
import { uploadImageBuffer, deleteImageByPublicId, publicIdFromUrl } from '../services/cloudinaryStorage.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '../uploads/site-content');

const ALLOWED_IMAGE_TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp']
]);

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], 'base64');
}

async function normalizeUploadedImage(buffer) {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_IMAGE_TYPES.has(detected.mime)) return null;

  const image = sharp(buffer, { failOn: 'error', limitInputPixels: 24_000_000 }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) return null;

  let output = await image
    .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();

  if (output.length > 2 * 1024 * 1024) {
    output = await sharp(output).webp({ quality: 74, effort: 5 }).toBuffer();
  }

  if (output.length > 2 * 1024 * 1024) {
    output = await sharp(output)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 68, effort: 5 })
      .toBuffer();
  }

  return { buffer: output, ext: 'webp', mime: 'image/webp', originalMime: detected.mime };
}

function safeGeneratedUploadName() {
  return `${crypto.randomUUID()}.webp`;
}

function serializeSiteContent(item) {
  const data = typeof item.toObject === 'function' ? item.toObject() : item;
  return { ...data, _id: String(data._id) };
}

function validObjectId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}

function cmsSlotKey(payload) {
  const section = String(payload.section || '').trim().toLowerCase();
  const type = String(payload.type || '').trim().toLowerCase();
  const placement = String(payload.placement || 'default').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const order = Number(payload.order || 0);
  return [section, type, placement, Number.isFinite(order) ? order : 0].join(':');
}

function cmsSlotFilter(payload) {
  const section = String(payload.section || '').trim();
  const type = String(payload.type || '').trim();
  const placement = String(payload.placement || '').trim();
  const order = Number(payload.order || 0);

  if (section && type && placement && Number.isFinite(order)) {
    return { slotKey: cmsSlotKey(payload) };
  }

  return { key: payload.key };
}

function normalizeCmsPayload(payload, userId) {
  const order = Number(payload.order || 0);
  const normalized = { ...payload, order, updatedBy: userId };
  normalized.slotKey = cmsSlotKey(normalized);

  if (!normalized.key && normalized.section && normalized.type && normalized.placement) {
    normalized.key = `${normalized.section}.${normalized.type}.${normalized.placement}.${order}`
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-');
  }

  return normalized;
}
export const adminRoutes = express.Router();

// Apply rate limiting and authentication to all admin routes
adminRoutes.use(adminLimiter);
adminRoutes.use(requireAuth, requireRole('ceo', 'coo', 'developer'));

function pagination(req) {
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const page = Math.max(Number(req.query.page || 1), 1);
  return { limit, skip: (page - 1) * limit };
}

function leadSearchFilter(req) {
  const q = String(req.query.q || '').trim();
  if (!q) return {};

  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(safe, 'i');

  return {
    $or: [
      { name: regex },
      { phone: regex },
      { alternatePhone: regex },
      { email: regex },
      { alternateEmail: regex },
      { reason: regex },
      { manualStatusNote: regex },
      { internalRemarks: regex }
    ]
  };
}

function activeLeadFilter(extra = {}) {
  return { lifecycleStatus: { $ne: 'archived' }, ...extra };
}

function combineLeadFilters(...filters) {
  const clean = filters.filter((filter) => filter && Object.keys(filter).length > 0);
  if (clean.length === 0) return {};
  if (clean.length === 1) return clean[0];
  return { $and: clean };
}

adminRoutes.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    res.json(await getDashboardMetrics());
  })
);

adminRoutes.get(
  '/survey-callbacks',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Lead.find(
      combineLeadFilters(activeLeadFilter({ source: 'survey_popup', status: 'survey_callback' }), leadSearchFilter(req))
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ items });
  })
);

adminRoutes.get(
  '/submitted-appointments',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Lead.find(
      combineLeadFilters(
        activeLeadFilter({ source: 'appointment_form', status: { $in: ['submitted', 'paid'] } }),
        leadSearchFilter(req)
      )
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('paymentId');

    res.json({ items });
  })
);

adminRoutes.get(
  '/collaboration-inquiries',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Lead.find(
      combineLeadFilters(
        activeLeadFilter({ source: 'collaboration_inquiry', status: { $in: ['submitted', 'paid'] } }),
        leadSearchFilter(req)
      )
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ items });
  })
);

adminRoutes.get(
  '/incomplete-leads',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Lead.find(
      combineLeadFilters(
        activeLeadFilter({
        status: 'draft',
        $or: [{ phone: { $ne: '' } }, { email: { $ne: '' } }]
        }),
        leadSearchFilter(req)
      )
    )
      .sort({ lastDraftAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ items });
  })
);

adminRoutes.get(
  '/confirmed-leads',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Lead.find(
      combineLeadFilters({ $or: [{ lifecycleStatus: 'confirmed' }, { paymentStatus: 'paid' }] }, leadSearchFilter(req))
    )
      .sort({ confirmedAt: -1, paidAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('paymentId');

    res.json({ items });
  })
);

adminRoutes.get(
  '/archived-leads',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Lead.find(combineLeadFilters({ lifecycleStatus: 'archived' }, leadSearchFilter(req)))
      .sort({ archivedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ items });
  })
);


adminRoutes.get(
  '/site-content',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.section) filter.section = String(req.query.section);
    if (req.query.type) filter.type = String(req.query.type);
    const items = await SiteContent.find(filter).sort({ section: 1, order: 1, updatedAt: -1 }).lean();
    res.json({ items: items.map(serializeSiteContent) });
  })
);

adminRoutes.post(
  '/site-content',
  auditMiddleware({ action: 'create', resource: 'site-content' }),
  validate(siteContentSchema),
  asyncHandler(async (req, res) => {
    const payload = normalizeCmsPayload(req.body, req.user._id);
    const scopedFilter = cmsSlotFilter(payload);
    const existing = await SiteContent.findOne(scopedFilter);
    const item = await SiteContent.findOneAndUpdate(
      scopedFilter,
      {
        $set: payload,
        $setOnInsert: { createdBy: req.user._id }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // When this save replaces a Cloudinary-hosted image in the same slot with a
    // different one, clean up the old asset so replaced CMS photos don't pile
    // up in the Cloudinary account forever. Best-effort: never blocks the
    // response, since the CMS save above already succeeded.
    if (existing && existing.imageUrl && existing.imageUrl !== item.imageUrl) {
      const oldPublicId = existing.metadata?.cloudinaryPublicId || publicIdFromUrl(existing.imageUrl);
      if (oldPublicId) {
        deleteImageByPublicId(oldPublicId).catch(() => {});
      }
    }

    emitAdminUpdate('site-content:updated', { contentId: item._id, action: existing ? 'update-slot' : 'create' });
    // Also broadcast to the public site — its live-update listener is a plain
    // socket.on('site-content:updated', ...) with no auth, so it needs an
    // actual broadcast, not the admins-only room emitAdminUpdate uses.
    emitPublicUpdate('site-content:updated', { contentId: item._id });
    res.status(existing ? 200 : 201).json({ item: serializeSiteContent(item), mode: existing ? 'updated' : 'created' });
  })
);
adminRoutes.patch(
  '/site-content/:id',
  auditMiddleware({ action: 'update', resource: 'site-content' }),
  validate(siteContentUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid content item id' });
    const item = await SiteContent.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedBy: req.user._id } },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Content item not found' });
    emitAdminUpdate('site-content:updated', { contentId: item._id, action: 'update' });
    emitPublicUpdate('site-content:updated', { contentId: item._id });
    res.json({ item: serializeSiteContent(item) });
  })
);

adminRoutes.delete(
  '/site-content/:id',
  auditMiddleware({ action: 'delete', resource: 'site-content' }),
  asyncHandler(async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid content item id' });
    const item = await SiteContent.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Content item not found' });

    if (item.imageUrl) {
      const publicId = item.metadata?.cloudinaryPublicId || publicIdFromUrl(item.imageUrl);
      if (publicId) {
        deleteImageByPublicId(publicId).catch(() => {});
      }
    }

    emitAdminUpdate('site-content:updated', { contentId: item._id, action: 'delete' });
    emitPublicUpdate('site-content:updated', { contentId: item._id, action: 'delete' });
    res.json({ ok: true });
  })
);

adminRoutes.post(
  '/site-media',
  auditMiddleware({ action: 'upload', resource: 'site-media' }),
  validate(siteMediaUploadSchema),
  asyncHandler(async (req, res) => {
    const buffer = parseDataUrl(req.body.dataUrl);
    if (!buffer) return res.status(400).json({ message: 'Invalid image payload' });
    if (buffer.length > 12 * 1024 * 1024) return res.status(413).json({ message: 'Image upload is too large' });

    const normalized = await normalizeUploadedImage(buffer);
    if (!normalized) return res.status(415).json({ message: 'Unsupported file type' });
    if (normalized.buffer.length > 2 * 1024 * 1024) return res.status(413).json({ message: 'Image could not be compressed safely' });

    let url;
    let cloudinaryPublicId = null;

    if (cloudinaryConfigured()) {
      // Preferred path: Cloudinary gives a permanent CDN URL that survives
      // redeploys/restarts on any host (Render, Vercel, etc.) — see
      // services/cloudinaryStorage.js for why local disk cannot guarantee that.
      const uploaded = await uploadImageBuffer(normalized.buffer, {
        folder: 'neurocogno/site-content'
      });
      url = uploaded.url;
      cloudinaryPublicId = uploaded.publicId;
    } else {
      // Fallback for local development / hosts with real persistent disk:
      // unchanged from the original behavior.
      await fs.mkdir(uploadRoot, { recursive: true });
      const filename = safeGeneratedUploadName();
      const filePath = path.join(uploadRoot, filename);
      await fs.writeFile(filePath, normalized.buffer);
      url = `/uploads/site-content/${filename}`;
    }

    emitAdminUpdate('site-content:media-uploaded', { url });
    emitPublicUpdate('site-content:media-uploaded', { url });
    res.status(201).json({ url, cloudinaryPublicId, storage: cloudinaryConfigured() ? 'cloudinary' : 'local-disk' });
  })
);

adminRoutes.patch(
  '/leads/:id',
  auditMiddleware({ action: 'update', resource: 'lead' }),
  validate(adminLeadUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid lead id' });
    const update = {
      ...req.body,
      lastEditedBy: req.user._id,
      lastEditedAt: new Date()
    };

    if (req.body.lifecycleStatus === 'confirmed') {
      update.confirmedAt = new Date();
      update.archivedAt = undefined;
    }

    if (req.body.paymentStatus === 'paid' && req.body.lifecycleStatus !== 'archived') {
      update.lifecycleStatus = 'confirmed';
      update.confirmedAt = new Date();
    }

    if (req.body.lifecycleStatus === 'archived') {
      update.archivedAt = new Date();
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    emitAdminUpdate('lead:updated', { leadId: lead._id, action: 'edit' });
    res.json({ item: lead });
  })
);

adminRoutes.post(
  '/leads/:id/confirm',
  auditMiddleware({ action: 'confirm', resource: 'lead' }),
  validate(leadActionSchema),
  asyncHandler(async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid lead id' });
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          lifecycleStatus: 'confirmed',
          confirmedAt: new Date(),
          manualStatusNote: req.body.remarks || 'Confirmed manually by admin',
          internalRemarks: req.body.remarks || '',
          lastEditedBy: req.user._id,
          lastEditedAt: new Date()
        }
      },
      { new: true }
    );

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    emitAdminUpdate('lead:updated', { leadId: lead._id, action: 'confirm' });
    res.json({ item: lead });
  })
);

adminRoutes.post(
  '/leads/:id/archive',
  auditMiddleware({ action: 'archive', resource: 'lead' }),
  validate(leadActionSchema),
  asyncHandler(async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid lead id' });
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          lifecycleStatus: 'archived',
          archivedAt: new Date(),
          archiveReason: req.body.archiveReason || 'Archived manually by admin',
          internalRemarks: req.body.remarks || '',
          lastEditedBy: req.user._id,
          lastEditedAt: new Date()
        }
      },
      { new: true }
    );

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    emitAdminUpdate('lead:updated', { leadId: lead._id, action: 'archive' });
    res.json({ item: lead });
  })
);

adminRoutes.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await Payment.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('leadId');

    res.json({ items });
  })
);

adminRoutes.get(
  '/traffic',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await VisitorEvent.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ items });
  })
);

adminRoutes.get(
  '/issues',
  asyncHandler(async (req, res) => {
    const { limit, skip } = pagination(req);
    const items = await SystemIssue.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ items });
  })
);

// New endpoint: Get audit trail for a specific lead
adminRoutes.get(
  '/leads/:id/audit',
  asyncHandler(async (req, res) => {
    const trail = await getResourceAuditTrail('lead', req.params.id, 100);
    res.json({ items: trail });
  })
);

// ============================================================================
// ADVANCED CRM FEATURES
// ============================================================================

/**
 * Bulk operations on leads
 */
adminRoutes.post(
  '/leads/bulk-action',
  auditMiddleware({ action: 'bulk_update', resource: 'lead' }),
  asyncHandler(async (req, res) => {
    const { action, leadIds, data } = req.body;

    if (!action || !leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: 'Action and leadIds are required' });
    }

    let updateData = {
      lastEditedBy: req.user._id,
      lastEditedAt: new Date()
    };

    switch (action) {
      case 'archive':
        updateData.lifecycleStatus = 'archived';
        updateData.archivedAt = new Date();
        updateData.archiveReason = data?.reason || 'Bulk archived by admin';
        break;

      case 'confirm':
        updateData.lifecycleStatus = 'confirmed';
        updateData.confirmedAt = new Date();
        break;

      case 'assign_tag':
        // Add custom tags functionality
        updateData.$addToSet = { tags: data?.tag };
        break;

      case 'change_priority':
        updateData.priority = data?.priority;
        break;

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      updateData
    );

    emitAdminUpdate('leads:bulk_updated', {
      action,
      count: result.modifiedCount,
      leadIds
    });

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      action
    });
  })
);

/**
 * Export leads to CSV
 */
adminRoutes.get(
  '/leads/export',
  asyncHandler(async (req, res) => {
    const { type, startDate, endDate } = req.query;

    const query = {};
    if (type && type !== 'all') {
      query.source = type;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const leads = await Lead.find(query)
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .lean();

    // Convert to CSV
    const csvHeaders = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'Source',
      'Status',
      'Lifecycle Status',
      'Payment Status',
      'Created At',
      'Confirmed At',
      'Paid At'
    ].join(',');

    const csvRows = leads.map(lead => [
      lead._id,
      `"${lead.name || ''}"`,
      lead.phone || '',
      lead.email || '',
      lead.source || '',
      lead.status || '',
      lead.lifecycleStatus || '',
      lead.paymentStatus || '',
      lead.createdAt?.toISOString() || '',
      lead.confirmedAt?.toISOString() || '',
      lead.paidAt?.toISOString() || ''
    ].join(','));

    const csv = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-export-${Date.now()}.csv"`);
    res.send(csv);
  })
);

/**
 * Get lead statistics and analytics
 */
adminRoutes.get(
  '/analytics/leads',
  asyncHandler(async (req, res) => {
    const { timeframe = '30d' } = req.query;

    const timeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const days = timeMap[timeframe] || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalStats,
      sourceBreakdown,
      conversionFunnel,
      timeSeriesData
    ] = await Promise.all([
      // Total statistics
      Lead.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'confirmed'] }, 1, 0] }
            },
            paid: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
            },
            archived: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'archived'] }, 1, 0] }
            }
          }
        }
      ]),

      // Source breakdown
      Lead.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Conversion funnel
      Lead.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Time series data (daily)
      Lead.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'confirmed'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const stats = totalStats[0] || { total: 0, confirmed: 0, paid: 0, archived: 0 };

    res.json({
      timeframe,
      summary: {
        ...stats,
        conversionRate: stats.total > 0 ? ((stats.confirmed / stats.total) * 100).toFixed(2) + '%' : '0%',
        paymentRate: stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(2) + '%' : '0%'
      },
      sourceBreakdown,
      conversionFunnel,
      timeSeries: timeSeriesData
    });
  })
);

/**
 * Get lead activity timeline
 */
adminRoutes.get(
  '/leads/:id/timeline',
  asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id).lean();

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Get audit trail
    const auditTrail = await getResourceAuditTrail('lead', req.params.id, 100);

    // Get payment history
    const payments = await Payment.find({ leadId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Combine into timeline
    const timeline = [
      {
        type: 'created',
        timestamp: lead.createdAt,
        description: `Lead created from ${lead.source}`,
        user: null
      },
      ...auditTrail.map(log => ({
        type: 'audit',
        timestamp: log.timestamp,
        description: `${log.action} by ${log.userId?.name || 'System'}`,
        user: log.userId,
        changes: log.changes
      })),
      ...payments.map(payment => ({
        type: 'payment',
        timestamp: payment.createdAt,
        description: `Payment ${payment.status}: ₹${payment.amount / 100}`,
        paymentId: payment._id,
        status: payment.status
      }))
    ];

    // Sort by timestamp
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ timeline });
  })
);

/**
 * Get dashboard real-time statistics (for live updates)
 */
adminRoutes.get(
  '/stats/realtime',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayStats, weekStats, monthStats] = await Promise.all([
      Lead.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            newLeads: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'confirmed'] }, 1, 0] }
            }
          }
        }
      ]),

      Lead.aggregate([
        { $match: { createdAt: { $gte: thisWeek } } },
        {
          $group: {
            _id: null,
            newLeads: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'confirmed'] }, 1, 0] }
            }
          }
        }
      ]),

      Lead.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        {
          $group: {
            _id: null,
            newLeads: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$lifecycleStatus', 'confirmed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    res.json({
      today: todayStats[0] || { newLeads: 0, confirmed: 0 },
      week: weekStats[0] || { newLeads: 0, confirmed: 0 },
      month: monthStats[0] || { newLeads: 0, confirmed: 0 }
    });
  })
);

/**
 * Advanced search with filters
 */
adminRoutes.post(
  '/leads/advanced-search',
  asyncHandler(async (req, res) => {
    const {
      query,
      source,
      status,
      lifecycleStatus,
      paymentStatus,
      dateFrom,
      dateTo,
      priority,
      tags,
      page = 1,
      limit = 50
    } = req.body;

    const filter = {};

    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { alternatePhone: regex },
        { alternateEmail: regex },
        { reason: regex },
        { internalRemarks: regex }
      ];
    }

    if (source) filter.source = source;
    if (status) filter.status = status;
    if (lifecycleStatus) filter.lifecycleStatus = lifecycleStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (priority) filter.priority = priority;
    if (tags && tags.length > 0) filter.tags = { $in: tags };

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('paymentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter)
    ]);

    res.json({
      items: leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  })
);


// --- Data backup & recovery ---------------------------------------------
// Lets an admin (ceo/coo/developer — same role gate as the rest of this
// router) download a full snapshot of the database on demand: JSON for
// exact, machine-restorable recovery, and an .xlsx workbook (one tab per
// collection, a Summary tab up front) for a human to actually read. Restricted
// to requireRole above, same as every other route in this file.
adminRoutes.get(
  '/backup/json',
  auditMiddleware({ action: 'export', resource: 'backup-json' }),
  asyncHandler(async (req, res) => {
    const data = await collectBackupData();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="neurocogno-backup-${stamp}.json"`);
    res.send(JSON.stringify({ generatedAt: new Date().toISOString(), data }, null, 2));
  })
);

adminRoutes.get(
  '/backup/excel',
  auditMiddleware({ action: 'export', resource: 'backup-excel' }),
  asyncHandler(async (req, res) => {
    const data = await collectBackupData();
    const workbook = await buildBackupWorkbook(data);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="neurocogno-backup-${stamp}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  })
);

