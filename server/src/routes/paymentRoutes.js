import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { paymentOrderSchema, paymentVerifySchema } from '../utils/validators.js';
import {
  createGatewayOrder,
  paymentPublicConfig,
  verifyRazorpaySignature,
  verifyWebhookSignature
} from '../services/paymentGateway.js';
import { Lead } from '../models/Lead.js';
import { Payment } from '../models/Payment.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { emitAdminUpdate } from '../services/realtime.js';
import { paymentLimiter, webhookLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/security.js';
import { logAudit } from '../services/auditLog.js';
import { env } from '../config/env.js';

export const paymentRoutes = express.Router();

// Apply payment rate limiter to payment endpoints
paymentRoutes.use('/orders', paymentLimiter);
paymentRoutes.use('/verify', paymentLimiter);
paymentRoutes.use('/webhook', webhookLimiter);

paymentRoutes.get('/config', (req, res) => {
  res.json(paymentPublicConfig());
});

paymentRoutes.post(
  '/orders',
  idempotencyMiddleware(),
  validate(paymentOrderSchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.body.leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Server-side amount verification (never trust client)
    const expectedAmount = env.BOOKING_AMOUNT_INR * 100; // Convert to paise

    const gateway = await createGatewayOrder({ leadId: lead._id });

    if (!gateway.configured) {
      lead.paymentStatus = 'not_configured';
      await lead.save();

      await logAudit({
        action: 'payment_created',
        resource: 'payment',
        resourceId: lead._id,
        ip: req.ip,
        metadata: { leadId: lead._id, configured: false },
        success: false,
        errorMessage: 'Payment gateway not configured',
        severity: 'error'
      });

      return res.status(503).json({
        message: 'Payment gateway not configured',
        payment: paymentPublicConfig()
      });
    }

    // Verify amount matches server configuration
    if (gateway.amount !== expectedAmount) {
      await logAudit({
        action: 'payment_created',
        resource: 'payment',
        resourceId: lead._id,
        ip: req.ip,
        metadata: { leadId: lead._id, expectedAmount, receivedAmount: gateway.amount },
        success: false,
        errorMessage: 'Amount mismatch',
        severity: 'critical'
      });

      return res.status(400).json({ message: 'Payment amount mismatch' });
    }

    const payment = await Payment.create({
      leadId: lead._id,
      amount: gateway.amount,
      currency: gateway.currency,
      status: 'created',
      providerOrderId: gateway.providerOrderId
    });

    lead.paymentStatus = 'created';
    lead.paymentId = payment._id;
    await lead.save();

    await logAudit({
      action: 'payment_created',
      resource: 'payment',
      resourceId: payment._id,
      ip: req.ip,
      metadata: { leadId: lead._id, amount: gateway.amount, orderId: gateway.providerOrderId },
      success: true,
      severity: 'info'
    });

    emitAdminUpdate('payment:created', { leadId: lead._id, paymentId: payment._id });

    res.status(201).json({
      orderId: gateway.providerOrderId,
      amount: gateway.amount,
      currency: gateway.currency,
      keyId: paymentPublicConfig().keyId,
      leadId: lead._id
    });
  })
);

paymentRoutes.post(
  '/verify',
  idempotencyMiddleware(),
  validate(paymentVerifySchema),
  asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({
      leadId: req.body.leadId,
      providerOrderId: req.body.razorpay_order_id
    });

    if (!payment) {
      await logAudit({
        action: 'payment_failed',
        resource: 'payment',
        ip: req.ip,
        metadata: { leadId: req.body.leadId, orderId: req.body.razorpay_order_id },
        success: false,
        errorMessage: 'Payment record not found',
        severity: 'error'
      });
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Prevent duplicate verification
    if (payment.status === 'captured' && payment.verifiedAt) {
      return res.json({ ok: true, message: 'Payment already verified' });
    }

    const valid = verifyRazorpaySignature({
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      signature: req.body.razorpay_signature
    });

    payment.providerPaymentId = req.body.razorpay_payment_id;
    payment.providerSignature = req.body.razorpay_signature;
    payment.verifiedAt = new Date();

    const lead = await Lead.findById(req.body.leadId);

    if (!valid) {
      payment.status = 'signature_failed';
      payment.failureReason = 'Client payment signature did not match gateway secret.';
      await payment.save();

      const signatureIssue = await SystemIssue.create({
        type: 'payment',
        severity: 'critical',
        title: 'Payment signature verification failed',
        message: `Lead ${req.body.leadId} returned an invalid Razorpay signature.`,
        metadata: { leadId: req.body.leadId, paymentId: payment._id }
      });
      emitAdminUpdate('system:issue', { issueId: signatureIssue._id, title: signatureIssue.title, severity: signatureIssue.severity });

      await logAudit({
        action: 'payment_failed',
        resource: 'payment',
        resourceId: payment._id,
        ip: req.ip,
        metadata: { leadId: req.body.leadId, reason: 'signature_mismatch' },
        success: false,
        errorMessage: 'Signature verification failed',
        severity: 'critical'
      });

      if (lead) {
        lead.paymentStatus = 'failed';
        await lead.save();
      }

      emitAdminUpdate('payment:failed', { leadId: req.body.leadId, paymentId: payment._id });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    payment.status = 'captured';
    await payment.save();

    if (lead) {
      lead.status = 'paid';
      lead.paymentStatus = 'paid';
      lead.lifecycleStatus = 'confirmed';
      lead.confirmedAt = lead.confirmedAt || new Date();
      lead.paidAt = new Date();
      await lead.save();
    }

    await logAudit({
      action: 'payment_verified',
      resource: 'payment',
      resourceId: payment._id,
      ip: req.ip,
      metadata: { leadId: req.body.leadId, amount: payment.amount, paymentId: payment.providerPaymentId },
      success: true,
      severity: 'info'
    });

    emitAdminUpdate('payment:paid', { leadId: req.body.leadId, paymentId: payment._id });
    return res.json({ ok: true });
  })
);

function duplicateKey(error) {
  return error?.code === 11000 || (error?.name === 'MongoServerError' && error?.code === 11000);
}

function fallbackWebhookId(event, paymentEntity, rawBody) {
  return [
    event?.event || 'unknown_event',
    paymentEntity?.id || 'no_payment',
    paymentEntity?.order_id || 'no_order',
    Buffer.from(rawBody).toString('base64').slice(0, 48)
  ].join(':');
}
paymentRoutes.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body || {});
    const signature = req.get('x-razorpay-signature');
    const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const paymentEntity = event?.payload?.payment?.entity;
    const webhookId = req.get('x-razorpay-event-id') || event?.id || fallbackWebhookId(event, paymentEntity, rawBody);

    if (!verifyWebhookSignature(rawBody, signature)) {
      const webhookIssue = await SystemIssue.create({
        type: 'payment',
        severity: 'critical',
        title: 'Payment webhook signature failed',
        message: 'Received a Razorpay webhook with an invalid signature.',
        metadata: { ip: req.ip, webhookId }
      });
      emitAdminUpdate('system:issue', { issueId: webhookIssue._id, title: webhookIssue.title, severity: webhookIssue.severity });

      await logAudit({
        action: 'payment_failed',
        resource: 'payment',
        ip: req.ip,
        metadata: { webhookId, reason: 'invalid_signature' },
        success: false,
        errorMessage: 'Invalid webhook signature',
        severity: 'critical'
      });

      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    let webhookEvent;
    try {
      webhookEvent = await WebhookEvent.create({
        provider: 'razorpay',
        eventId: webhookId,
        eventType: event?.event || 'unknown',
        providerOrderId: paymentEntity?.order_id || '',
        providerPaymentId: paymentEntity?.id || '',
        status: 'processing',
        metadata: { ip: req.ip }
      });
    } catch (error) {
      if (duplicateKey(error)) {
        await logAudit({
          action: 'payment_webhook_duplicate',
          resource: 'payment',
          ip: req.ip,
          metadata: { webhookId, event: event?.event },
          success: true,
          severity: 'info'
        });
        return res.json({ ok: true, duplicate: true });
      }
      throw error;
    }

    try {
      if (paymentEntity?.order_id) {
        const nextStatus = paymentEntity.status === 'captured' ? 'captured' : paymentEntity.status;
        let payment = null;
        let transitionedToCaptured = false;

        if (nextStatus === 'captured') {
          payment = await Payment.findOneAndUpdate(
            { providerOrderId: paymentEntity.order_id, status: { $ne: 'captured' } },
            {
              $set: {
                providerPaymentId: paymentEntity.id,
                status: 'captured',
                rawWebhookEvent: event.event,
                verifiedAt: new Date()
              }
            },
            { new: true, runValidators: true }
          );
          transitionedToCaptured = Boolean(payment);

          if (!payment) {
            payment = await Payment.findOneAndUpdate(
              { providerOrderId: paymentEntity.order_id },
              {
                $set: {
                  providerPaymentId: paymentEntity.id,
                  rawWebhookEvent: event.event
                }
              },
              { new: true, runValidators: true }
            );
          }
        } else {
          payment = await Payment.findOneAndUpdate(
            { providerOrderId: paymentEntity.order_id },
            {
              $set: {
                providerPaymentId: paymentEntity.id,
                status: nextStatus || 'created',
                rawWebhookEvent: event.event
              }
            },
            { new: true, runValidators: true }
          );
        }

        if (payment) {
          if (transitionedToCaptured) {
            await Lead.findOneAndUpdate(
              { _id: payment.leadId, paymentStatus: { $ne: 'paid' } },
              {
                $set: {
                  status: 'paid',
                  paymentStatus: 'paid',
                  lifecycleStatus: 'confirmed',
                  confirmedAt: new Date(),
                  paidAt: new Date()
                }
              },
              { new: true }
            );
          }

          await logAudit({
            action: transitionedToCaptured ? 'payment_verified' : 'payment_webhook_reconciled',
            resource: 'payment',
            resourceId: payment._id,
            ip: req.ip,
            metadata: { webhookId, orderId: paymentEntity.order_id, status: payment.status },
            success: true,
            severity: 'info'
          });
        }
      }

      webhookEvent.status = 'processed';
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();

      emitAdminUpdate('payment:webhook', { event: event.event });
      res.json({ ok: true });
    } catch (error) {
      webhookEvent.status = 'failed';
      webhookEvent.failureReason = error.message;
      await webhookEvent.save();
      throw error;
    }
  })
);



