import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['razorpay'], default: 'razorpay', index: true },
    eventId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    providerOrderId: { type: String, index: true, default: '' },
    providerPaymentId: { type: String, index: true, default: '' },
    status: { type: String, enum: ['processing', 'processed', 'failed', 'ignored'], default: 'processing', index: true },
    processedAt: Date,
    failureReason: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookEventSchema.index({ eventType: 1, status: 1, createdAt: -1 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

