/**
 * Notification System
 * For sending notifications across email, SMS, WhatsApp, in-app
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

const notificationSchema = new mongoose.Schema({
  // Recipient
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
  recipientPhone: String,
  recipientEmail: String,

  // Notification details
  type: {
    type: String,
    enum: [
      'session_reminder',
      'session_scheduled',
      'session_cancelled',
      'session_rescheduled',
      'payment_due',
      'payment_received',
      'payment_failed',
      'profile_update',
      'welcome',
      'feedback_request',
      'package_expiring',
      'general'
    ],
    required: true,
    index: true
  },

  title: { type: String, required: true },
  message: { type: String, required: true },

  // Rich content
  data: mongoose.Schema.Types.Mixed, // Additional data for the notification
  actionUrl: String, // Deep link or URL to open
  actionLabel: String, // "View Details", "Book Now", etc.

  // Channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },

  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  failedAt: Date,
  failureReason: String,

  // Delivery status per channel
  deliveryStatus: {
    inApp: { sent: Boolean, deliveredAt: Date, readAt: Date },
    email: { sent: Boolean, deliveredAt: Date, error: String },
    sms: { sent: Boolean, deliveredAt: Date, error: String },
    whatsapp: { sent: Boolean, deliveredAt: Date, error: String }
  },

  // Priority & scheduling
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  scheduledFor: Date,

  // Metadata
  relatedEntity: {
    type: String, // 'session', 'payment', 'profile'
    entityId: mongoose.Schema.Types.ObjectId
  },

  expiresAt: Date

}, {
  timestamps: true,
  collection: 'notifications'
});

// Indexes
notificationSchema.index({ profileId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

/**
 * Notification Service
 */
export class NotificationService {

  /**
   * Create and send notification
   */
  static async send({
    profileId,
    userId,
    type,
    title,
    message,
    channels = { inApp: true },
    priority = 'medium',
    data = {},
    actionUrl,
    actionLabel,
    scheduledFor
  }) {
    try {
      // Get user profile to check preferences
      const { UserProfile } = await import('../models/UserProfile.js');
      const profile = await UserProfile.findById(profileId);

      if (!profile) {
        logger.error({ profileId }, 'Profile not found for notification');
        return null;
      }

      // Respect user preferences
      const prefs = profile.notificationPreferences || {};
      const finalChannels = {
        inApp: channels.inApp !== false,
        email: channels.email && prefs.email,
        sms: channels.sms && prefs.sms,
        whatsapp: channels.whatsapp && prefs.whatsapp
      };

      // Create notification
      const notification = await Notification.create({
        userId,
        profileId,
        recipientPhone: profile.phone,
        recipientEmail: profile.email,
        type,
        title,
        message,
        channels: finalChannels,
        priority,
        data,
        actionUrl,
        actionLabel,
        scheduledFor: scheduledFor || new Date(),
        relatedEntity: data.entityType ? {
          type: data.entityType,
          entityId: data.entityId
        } : undefined
      });

      // Update unread count
      profile.unreadNotifications = (profile.unreadNotifications || 0) + 1;
      await profile.save();

      // Send immediately if not scheduled
      if (!scheduledFor || scheduledFor <= new Date()) {
        await this.deliver(notification);
      }

      // Emit real-time event
      const { emitUserNotification } = await import('../services/realtime.js');
      emitUserNotification(profileId.toString(), {
        type: 'notification:new',
        notification: {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          createdAt: notification.createdAt
        }
      });

      return notification;

    } catch (error) {
      logger.error({ error }, 'Failed to send notification');
      return null;
    }
  }

  /**
   * Deliver notification through channels
   */
  static async deliver(notification) {
    const deliveryStatus = {};

    // In-app notification (always succeeds)
    if (notification.channels.inApp) {
      deliveryStatus.inApp = {
        sent: true,
        deliveredAt: new Date()
      };
    }

    // Email notification
    if (notification.channels.email && notification.recipientEmail) {
      try {
        // TODO: Integrate email service (SendGrid, AWS SES, etc.)
        await this.sendEmail(notification);
        deliveryStatus.email = {
          sent: true,
          deliveredAt: new Date()
        };
      } catch (error) {
        deliveryStatus.email = {
          sent: false,
          error: error.message
        };
      }
    }

    // SMS notification
    if (notification.channels.sms && notification.recipientPhone) {
      try {
        // TODO: Integrate SMS service (Twilio, AWS SNS, etc.)
        await this.sendSMS(notification);
        deliveryStatus.sms = {
          sent: true,
          deliveredAt: new Date()
        };
      } catch (error) {
        deliveryStatus.sms = {
          sent: false,
          error: error.message
        };
      }
    }

    // WhatsApp notification
    if (notification.channels.whatsapp && notification.recipientPhone) {
      try {
        // TODO: Integrate WhatsApp Business API
        await this.sendWhatsApp(notification);
        deliveryStatus.whatsapp = {
          sent: true,
          deliveredAt: new Date()
        };
      } catch (error) {
        deliveryStatus.whatsapp = {
          sent: false,
          error: error.message
        };
      }
    }

    // Update notification
    notification.deliveryStatus = deliveryStatus;
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();

    return deliveryStatus;
  }

  /**
   * Send email (placeholder - integrate your email service)
   */
  static async sendEmail(notification) {
    // TODO: Integrate email service
    logger.info({
      to: notification.recipientEmail,
      subject: notification.title,
      body: notification.message
    }, 'Email would be sent');

    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // await sgMail.send({
    //   to: notification.recipientEmail,
    //   from: 'noreply@neurocogno.com',
    //   subject: notification.title,
    //   html: notification.message
    // });
  }

  /**
   * Send SMS (placeholder - integrate your SMS service)
   */
  static async sendSMS(notification) {
    // TODO: Integrate SMS service
    logger.info({
      to: notification.recipientPhone,
      body: notification.message
    }, 'SMS would be sent');

    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   to: notification.recipientPhone,
    //   from: '+1234567890',
    //   body: notification.message
    // });
  }

  /**
   * Send WhatsApp (placeholder - integrate WhatsApp Business API)
   */
  static async sendWhatsApp(notification) {
    // TODO: Integrate WhatsApp Business API
    logger.info({
      to: notification.recipientPhone,
      body: notification.message
    }, 'WhatsApp would be sent');
  }

  /**
   * Send session reminder
   */
  static async sendSessionReminder(session, profile) {
    const sessionDate = new Date(session.scheduledDate);
    const formattedDate = sessionDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return await this.send({
      profileId: profile._id,
      type: 'session_reminder',
      title: 'Session Reminder',
      message: `Your counseling session is scheduled for ${formattedDate} at ${session.scheduledTime}. See you soon!`,
      channels: {
        inApp: true,
        email: true,
        sms: true,
        whatsapp: true
      },
      priority: 'high',
      actionUrl: `/profile/sessions/${session._id}`,
      actionLabel: 'View Details',
      data: {
        entityType: 'session',
        entityId: session._id,
        sessionDate: session.scheduledDate,
        sessionTime: session.scheduledTime
      }
    });
  }

  /**
   * Send payment reminder
   */
  static async sendPaymentReminder(profile, amount) {
    return await this.send({
      profileId: profile._id,
      type: 'payment_due',
      title: 'Payment Due',
      message: `Your payment of ₹${amount} is due. Please complete the payment to continue your sessions.`,
      channels: {
        inApp: true,
        email: true,
        sms: true
      },
      priority: 'high',
      actionUrl: '/profile/payments',
      actionLabel: 'Pay Now',
      data: {
        amount
      }
    });
  }

  /**
   * Send welcome notification
   */
  static async sendWelcome(profile) {
    return await this.send({
      profileId: profile._id,
      type: 'welcome',
      title: 'Welcome to NeuroCogno!',
      message: `Hi ${profile.name}, welcome to NeuroCogno! We're here to support your mental wellness journey. Your first session will be scheduled soon.`,
      channels: {
        inApp: true,
        email: true
      },
      priority: 'medium',
      actionUrl: '/profile',
      actionLabel: 'Complete Profile'
    });
  }
}

/**
 * Schedule automatic notifications (run periodically)
 */
export async function processScheduledNotifications() {
  const now = new Date();

  // Find pending scheduled notifications
  const pending = await Notification.find({
    status: 'pending',
    scheduledFor: { $lte: now }
  }).limit(100);

  for (const notification of pending) {
    await NotificationService.deliver(notification);
  }

  logger.info({ count: pending.length }, 'Processed scheduled notifications');
}

/**
 * Send session reminders (run hourly)
 */
export async function sendSessionReminders() {
  const { UserProfile } = await import('../models/UserProfile.js');

  // 24 hours before
  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(tomorrowEnd.getHours() + 1);

  const profiles24h = await UserProfile.find({
    'sessions.scheduledDate': {
      $gte: tomorrow,
      $lt: tomorrowEnd
    },
    'sessions.status': 'scheduled',
    'notificationPreferences.reminderBefore24h': true
  });

  for (const profile of profiles24h) {
    const session = profile.sessions.find(s =>
      s.scheduledDate >= tomorrow &&
      s.scheduledDate < tomorrowEnd &&
      s.status === 'scheduled'
    );
    if (session) {
      await NotificationService.sendSessionReminder(session, profile);
    }
  }

  // 1 hour before
  const oneHour = new Date();
  oneHour.setHours(oneHour.getHours() + 1);
  const oneHourEnd = new Date(oneHour);
  oneHourEnd.setMinutes(oneHourEnd.getMinutes() + 15);

  const profiles1h = await UserProfile.find({
    'sessions.scheduledDate': {
      $gte: oneHour,
      $lt: oneHourEnd
    },
    'sessions.status': 'scheduled',
    'notificationPreferences.reminderBefore1h': true
  });

  for (const profile of profiles1h) {
    const session = profile.sessions.find(s =>
      s.scheduledDate >= oneHour &&
      s.scheduledDate < oneHourEnd &&
      s.status === 'scheduled'
    );
    if (session) {
      await NotificationService.sendSessionReminder(session, profile);
    }
  }

  logger.info({
    reminders24h: profiles24h.length,
    reminders1h: profiles1h.length
  }, 'Session reminders sent');
}

// Auto-cleanup old notifications (run daily)
export async function cleanupOldNotifications() {
  const result = await Notification.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      {
        createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // 90 days old
        status: 'read'
      }
    ]
  });

  logger.info({ deletedCount: result.deletedCount }, 'Cleaned up old notifications');
}
