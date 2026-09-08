import mongoose from 'mongoose';

const surveyAnswerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true }
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: ['survey_popup', 'appointment_form', 'collaboration_inquiry'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'survey_callback', 'paid', 'cancelled'],
      default: 'draft',
      index: true
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    ageGroup: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    answers: [surveyAnswerSchema],
    consentToContact: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ['not_started', 'created', 'paid', 'failed', 'not_configured'],
      default: 'not_started',
      index: true
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    lifecycleStatus: {
      type: String,
      enum: ['active', 'confirmed', 'archived'],
      default: 'active',
      index: true
    },
    manualStatusNote: { type: String, trim: true, default: '' },
    archiveReason: { type: String, trim: true, default: '' },
    internalRemarks: { type: String, trim: true, default: '' },
    alternatePhone: { type: String, trim: true, default: '' },
    alternateEmail: { type: String, trim: true, lowercase: true, default: '' },

    // CRM enhancements
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    tags: [{ type: String, trim: true }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastContactedAt: Date,
    nextFollowUpAt: Date,

    // Tracking fields
    confirmedAt: Date,
    archivedAt: Date,
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEditedAt: Date,
    lastDraftAt: Date,
    submittedAt: Date,
    paidAt: Date,

    // Security and tracking
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
leadSchema.index({ source: 1, status: 1, createdAt: -1 });
leadSchema.index({ phone: 1, email: 1, name: 1 });
leadSchema.index({ lifecycleStatus: 1, updatedAt: -1 });
leadSchema.index({ priority: 1, lifecycleStatus: 1, createdAt: -1 });
leadSchema.index({ assignedTo: 1, lifecycleStatus: 1 });
leadSchema.index({ tags: 1 });
leadSchema.index({ nextFollowUpAt: 1, lifecycleStatus: 1 });

// Text index for full-text search
leadSchema.index({
  name: 'text',
  phone: 'text',
  email: 'text',
  reason: 'text',
  internalRemarks: 'text'
});

export const Lead = mongoose.model('Lead', leadSchema);
