import { z } from 'zod';

const phoneRegex = /^[+]?[\d\s()-]{7,18}$/;

const answerSchema = z.object({
  question: z.string().trim().min(1).max(220),
  answer: z.string().trim().min(1).max(800)
});

export const leadDraftSchema = z.object({
  visitorId: z.string().min(8).max(120),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(phoneRegex).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  source: z.enum(['appointment_form', 'survey_popup', 'collaboration_inquiry']).default('appointment_form'),
  ageGroup: z.string().trim().max(40).optional().or(z.literal('')),
  reason: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal(''))
});

export const appointmentSchema = leadDraftSchema.extend({
  phone: z.string().trim().regex(phoneRegex),
  consentToContact: z.literal(true),
  answers: z.array(answerSchema).max(12).optional()
});

export const collaborationInquirySchema = z.object({
  visitorId: z.string().min(8).max(120),
  name: z.string().trim().min(2).max(100),
  organization: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().regex(phoneRegex),
  email: z.string().trim().email().optional().or(z.literal('')),
  collaborationType: z.string().trim().min(2).max(120),
  message: z.string().trim().max(1200).optional().or(z.literal('')),
  consentToContact: z.literal(true)
});

export const surveyLeadSchema = z.object({
  visitorId: z.string().min(8).max(120),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(phoneRegex),
  email: z.string().trim().email().optional().or(z.literal('')),
  answers: z
    .array(
      answerSchema
    )
    .min(1)
    .max(12),
  consentToContact: z.literal(true)
});

export const visitorEventSchema = z.object({
  visitorId: z.string().min(8).max(120),
  type: z.enum(['page_view', 'section_view', 'nav_click', 'cta_click', 'form_focus', 'payment_opened']),
  path: z.string().max(200).optional(),
  section: z.string().max(80).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().min(2).max(120).optional(),
  password: z.string().min(4).max(200)
});

export const paymentOrderSchema = z.object({
  leadId: z.string().min(12),
  source: z.enum(['appointment_form', 'survey_popup'])
});

export const paymentVerifySchema = z.object({
  leadId: z.string().min(12),
  razorpay_order_id: z.string().min(8),
  razorpay_payment_id: z.string().min(8),
  razorpay_signature: z.string().min(16)
});

export const adminLeadUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  alternatePhone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  alternateEmail: z.string().trim().email().optional().or(z.literal('')),
  ageGroup: z.string().trim().max(60).optional(),
  reason: z.string().trim().max(160).optional(),
  message: z.string().trim().max(1200).optional(),
  manualStatusNote: z.string().trim().max(300).optional(),
  archiveReason: z.string().trim().max(300).optional(),
  internalRemarks: z.string().trim().max(1600).optional(),
  paymentStatus: z.enum(['not_started', 'created', 'paid', 'failed', 'not_configured']).optional(),
  lifecycleStatus: z.enum(['active', 'confirmed', 'archived']).optional()
});

export const leadActionSchema = z.object({
  remarks: z.string().trim().max(1600).optional(),
  archiveReason: z.string().trim().max(300).optional()
});

export const siteContentSchema = z.object({
  key: z.string().trim().min(2).max(120).regex(/^[a-z0-9._-]+$/),
  section: z.enum(['homepage', 'insights', 'workshops', 'collaborations', 'services', 'contact', 'global']),
  type: z.enum(['image', 'carousel_item', 'video', 'text', 'contact', 'link', 'setting']),
  label: z.string().trim().min(2).max(140),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  placement: z.string().trim().max(180).optional().or(z.literal('')),
  title: z.string().trim().max(180).optional().or(z.literal('')),
  subtitle: z.string().trim().max(300).optional().or(z.literal('')),
  body: z.string().trim().max(2000).optional().or(z.literal('')),
  value: z.string().trim().max(1200).optional().or(z.literal('')),
  url: z.string().trim().max(1200).optional().or(z.literal('')),
  imageUrl: z.string().trim().max(1200).optional().or(z.literal('')),
  alt: z.string().trim().max(180).optional().or(z.literal('')),
  order: z.coerce.number().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const siteContentUpdateSchema = siteContentSchema.partial().extend({
  key: z.string().trim().min(2).max(120).regex(/^[a-z0-9._-]+$/).optional()
});

export const siteMediaUploadSchema = z.object({
  filename: z.string().trim().min(4).max(180),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  dataUrl: z.string().min(40).max(16_000_000)
});