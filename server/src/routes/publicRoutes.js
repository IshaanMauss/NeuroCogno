import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  appointmentSchema,
  collaborationInquirySchema,
  leadDraftSchema,
  surveyLeadSchema,
  visitorEventSchema
} from '../utils/validators.js';
import { Lead } from '../models/Lead.js';
import { VisitorEvent } from '../models/VisitorEvent.js';
import { SiteContent } from '../models/SiteContent.js';
import { emitAdminUpdate } from '../services/realtime.js';
import { requestClientMeta } from '../services/requestFingerprint.js';
import { paymentPublicConfig } from '../services/paymentGateway.js';
import { env } from '../config/env.js';
import { formLimiter } from '../middleware/rateLimiter.js';

export const publicRoutes = express.Router();


function serializeSiteContent(item) {
  return { ...item, _id: String(item._id) };
}

publicRoutes.get(
  '/whatsapp-help',
  asyncHandler(async (req, res) => {
    const configured = await SiteContent.findOne({ key: 'global.whatsapp.help', isActive: true }).lean();
    const configuredNumber = String(configured?.value || '').replace(/\D/g, '');
    const fallbackNumber = String(env.WHATSAPP_HELP_NUMBER || '918851550848').replace(/\D/g, '');
    const helpNumber = configuredNumber || fallbackNumber;
    const text = encodeURIComponent('Hello NeuroCogno team, I need help.');
    res.redirect(302, `https://wa.me/${helpNumber}?text=${text}`);
  })
);

publicRoutes.get(
  '/site-content',
  asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    if (req.query.section) filter.section = req.query.section;
    if (req.query.type) filter.type = req.query.type;
    const items = await SiteContent.find(filter)
      .select('-createdBy -updatedBy -metadata')
      .sort({ section: 1, order: 1, updatedAt: -1 })
      .lean();
    res.json({ items: items.map(serializeSiteContent) });
  })
);
publicRoutes.get('/config', (req, res) => {
  res.json({
    payment: paymentPublicConfig(),
    contact: {
      ceoPhone: env.CEO_PHONE,
      email: env.BUSINESS_EMAIL,
      emails: [env.INFO_EMAIL, env.SUPPORT_EMAIL],
      address: env.BUSINESS_ADDRESS
    }
  });
});

publicRoutes.post(
  '/visitor-events',
  validate(visitorEventSchema),
  asyncHandler(async (req, res) => {
    await VisitorEvent.create({
      ...req.body,
      ...requestClientMeta(req)
    });

    emitAdminUpdate('traffic:update', { type: req.body.type });
    res.status(201).json({ ok: true });
  })
);

publicRoutes.post(
  '/lead-drafts',
  formLimiter,
  validate(leadDraftSchema),
  asyncHandler(async (req, res) => {
    if (!req.body.phone && !req.body.email) {
      return res.status(400).json({ message: 'Phone or email is required for draft follow-up' });
    }

    const meta = requestClientMeta(req);
    const lead = await Lead.findOneAndUpdate(
      {
        visitorId: req.body.visitorId,
        source: req.body.source,
        status: 'draft'
      },
      {
        $set: {
          ...req.body,
          status: 'draft',
          lastDraftAt: new Date(),
          ...meta
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    emitAdminUpdate('lead:draft', { leadId: lead._id });
    res.status(201).json({ leadId: lead._id });
  })
);

publicRoutes.post(
  '/appointments',
  formLimiter,
  validate(appointmentSchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.findOneAndUpdate(
      {
        visitorId: req.body.visitorId,
        source: 'appointment_form',
        status: 'draft'
      },
      {
        $set: {
          ...req.body,
          source: 'appointment_form',
          status: 'submitted',
          submittedAt: new Date(),
          ...requestClientMeta(req)
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    emitAdminUpdate('lead:submitted', { leadId: lead._id });
    res.status(201).json({ leadId: lead._id, payment: paymentPublicConfig() });
  })
);

publicRoutes.post(
  '/survey-callbacks',
  formLimiter,
  validate(surveyLeadSchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.create({
      ...req.body,
      source: 'survey_popup',
      status: 'survey_callback',
      submittedAt: new Date(),
      ...requestClientMeta(req)
    });

    emitAdminUpdate('lead:survey', { leadId: lead._id });
    res.status(201).json({ leadId: lead._id, payment: paymentPublicConfig() });
  })
);

publicRoutes.post(
  '/collaboration-inquiries',
  formLimiter,
  validate(collaborationInquirySchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.create({
      visitorId: req.body.visitorId,
      source: 'collaboration_inquiry',
      status: 'submitted',
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || '',
      reason: req.body.collaborationType,
      message: [
        req.body.organization ? `Organization: ${req.body.organization}` : '',
        req.body.message || ''
      ]
        .filter(Boolean)
        .join('\n'),
      consentToContact: req.body.consentToContact,
      submittedAt: new Date(),
      ...requestClientMeta(req)
    });

    emitAdminUpdate('lead:collaboration', { leadId: lead._id });
    res.status(201).json({ leadId: lead._id });
  })
);


