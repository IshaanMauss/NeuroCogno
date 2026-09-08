import mongoose from 'mongoose';

const visitorEventSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['page_view', 'section_view', 'nav_click', 'cta_click', 'form_focus', 'payment_opened'],
      required: true,
      index: true
    },
    path: String,
    section: String,
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
    ipHash: String,
    userAgent: String
  },
  { timestamps: true }
);

visitorEventSchema.index({ createdAt: -1 });

export const VisitorEvent = mongoose.model('VisitorEvent', visitorEventSchema);
