import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { emitAdminUpdate } from './realtime.js';

function isConfigured() {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function razorpayClient() {
  if (!isConfigured()) return null;
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
}

export function paymentPublicConfig() {
  return {
    provider: 'razorpay',
    configured: isConfigured(),
    keyId: env.RAZORPAY_KEY_ID || '',
    amountInr: env.BOOKING_AMOUNT_INR
  };
}

export async function createGatewayOrder({ leadId }) {
  const amountPaise = env.BOOKING_AMOUNT_INR * 100;
  const client = razorpayClient();

  if (!client) {
    const gatewayIssue = await SystemIssue.create({
      type: 'payment',
      severity: 'high',
      title: 'Payment gateway is not configured',
      message: 'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.'
    });
    emitAdminUpdate('system:issue', { issueId: gatewayIssue._id, title: gatewayIssue.title, severity: gatewayIssue.severity });
    return { configured: false, amount: amountPaise, currency: 'INR' };
  }

  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `lead_${leadId}`,
    notes: { leadId: String(leadId), product: 'NeuroCogno booking slot' }
  });

  return {
    configured: true,
    amount: amountPaise,
    currency: 'INR',
    providerOrderId: order.id,
    order
  };
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expected.length !== String(signature || '').length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
}
