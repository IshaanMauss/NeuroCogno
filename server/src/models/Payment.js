import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'signature_failed'],
      default: 'created',
      index: true
    },
    providerOrderId: { type: String, index: true },
    providerPaymentId: { type: String, index: true },
    providerSignature: String,
    failureReason: String,
    rawWebhookEvent: String,
    verifiedAt: Date
  },
  { timestamps: true }
);

paymentSchema.index({ providerOrderId: 1, providerPaymentId: 1 }, { unique: false });

export const Payment = mongoose.model('Payment', paymentSchema);
