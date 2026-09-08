/**
 * User Profile Routes
 * For client-facing profile management, bookings, and notifications
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserProfile } from '../models/UserProfile.js';
import { Notification, NotificationService } from '../services/notificationService.js';
import { Lead } from '../models/Lead.js';
import { Payment } from '../models/Payment.js';
import { logAudit } from '../services/auditLog.js';

export const profileRoutes = express.Router();

// SECURITY: This router exposes therapy-adjacent client data (medical history,
// payment history, session history, contact details) looked up only by
// phone/email/profileId with no ownership check on most routes. There is no
// separate client-login system yet, and nothing in the public site calls
// these endpoints (verified: no `/api/profile` reference anywhere under
// client/src). Until a real client-auth flow exists, require the same staff
// auth as the admin API so this surface cannot be hit anonymously/by IDOR.
profileRoutes.use(requireAuth);

/**
 * Create profile from lead (after payment)
 */
profileRoutes.post('/create', asyncHandler(async (req, res) => {
  const { leadId } = req.body;

  if (!leadId) {
    return res.status(400).json({ message: 'Lead ID required' });
  }

  // Check if profile already exists
  const existing = await UserProfile.findOne({ leadId });
  if (existing) {
    return res.json({ profile: existing });
  }

  // Get lead data
  const lead = await Lead.findById(leadId).populate('paymentId');
  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  // Create profile
  const profile = await UserProfile.create({
    leadId: lead._id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    ageGroup: lead.ageGroup,
    primaryConcern: lead.reason,
    journeyStatus: lead.paymentStatus === 'paid' ? 'payment_completed' : 'enquiry',
    totalAmountPaid: lead.paymentId?.amount || 0,
    paymentHistory: lead.paymentId ? [{
      paymentId: lead.paymentId._id,
      amount: lead.paymentId.amount,
      paidAt: lead.paidAt,
      purpose: 'initial_booking',
      razorpayPaymentId: lead.paymentId.providerPaymentId
    }] : [],
    createdFrom: 'web'
  });

  profile.calculateCompleteness();
  await profile.save();

  // Send welcome notification
  await NotificationService.sendWelcome(profile);

  await logAudit({
    action: 'create',
    resource: 'profile',
    resourceId: profile._id,
    ip: req.ip,
    metadata: { leadId }
  });

  res.status(201).json({ profile });
}));

/**
 * Get own profile
 */
profileRoutes.get('/me', asyncHandler(async (req, res) => {
  // For now, use phone/email to find profile (until auth is implemented)
  const { phone, email } = req.query;

  if (!phone && !email) {
    return res.status(400).json({ message: 'Phone or email required' });
  }

  const query = {};
  if (phone) query.phone = phone;
  if (email) query.email = email.toLowerCase();

  const profile = await UserProfile.findOne(query).populate('sessions.counselorId', 'name');

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json({ profile });
}));

/**
 * Update profile
 */
profileRoutes.patch('/me', asyncHandler(async (req, res) => {
  const { phone, email, profileId } = req.body;

  const query = profileId ? { _id: profileId } : { $or: [{ phone }, { email: email?.toLowerCase() }] };

  const profile = await UserProfile.findOne(query);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  // Allowed updates
  const updates = {};
  const allowedFields = [
    'alternatePhone', 'alternateEmail', 'preferredCounselorGender',
    'preferredLanguage', 'additionalConcerns', 'preferredTheme',
    'notificationPreferences'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Medical history (nested)
  if (req.body.medicalHistory) {
    updates.medicalHistory = {
      ...profile.medicalHistory,
      ...req.body.medicalHistory
    };
  }

  Object.assign(profile, updates);
  profile.calculateCompleteness();
  await profile.save();

  await logAudit({
    action: 'update',
    resource: 'profile',
    resourceId: profile._id,
    ip: req.ip,
    changes: { after: updates }
  });

  res.json({ profile });
}));

/**
 * Get session history
 */
profileRoutes.get('/me/sessions', asyncHandler(async (req, res) => {
  const { phone, email, profileId } = req.query;

  const query = profileId ? { _id: profileId } : { $or: [{ phone }, { email: email?.toLowerCase() }] };

  const profile = await UserProfile.findOne(query).populate('sessions.counselorId', 'name');
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  const nextSession = profile.getNextSession();
  const history = profile.getSessionHistory();

  res.json({
    nextSession,
    history,
    stats: {
      total: profile.totalSessionsBooked,
      completed: profile.totalSessionsCompleted,
      cancelled: profile.totalSessionsCancelled,
      remaining: profile.sessionsRemaining
    }
  });
}));

/**
 * Get payment history
 */
profileRoutes.get('/me/payments', asyncHandler(async (req, res) => {
  const { phone, email, profileId } = req.query;

  const query = profileId ? { _id: profileId } : { $or: [{ phone }, { email: email?.toLowerCase() }] };

  const profile = await UserProfile.findOne(query).populate('paymentHistory.paymentId');
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json({
    paymentHistory: profile.paymentHistory,
    totalPaid: profile.totalAmountPaid,
    totalDue: profile.totalAmountDue,
    nextPaymentDue: profile.nextPaymentDue,
    isOverdue: profile.isPaymentOverdue()
  });
}));

/**
 * Get notifications
 */
profileRoutes.get('/me/notifications', asyncHandler(async (req, res) => {
  const { phone, email, profileId, page = 1, limit = 50, unreadOnly } = req.query;

  const query = profileId ? { _id: profileId } : { $or: [{ phone }, { email: email?.toLowerCase() }] };

  const profile = await UserProfile.findOne(query);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  const notifQuery = { profileId: profile._id };
  if (unreadOnly === 'true') {
    notifQuery['deliveryStatus.inApp.readAt'] = { $exists: false };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(notifQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(notifQuery),
    Notification.countDocuments({
      profileId: profile._id,
      'deliveryStatus.inApp.readAt': { $exists: false }
    })
  ]);

  res.json({
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * Mark notification as read
 */
profileRoutes.post('/me/notifications/:id/read', asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  if (!notification.deliveryStatus.inApp.readAt) {
    notification.deliveryStatus.inApp.readAt = new Date();
    notification.readAt = new Date();
    notification.status = 'read';
    await notification.save();

    // Decrease unread count
    await UserProfile.findByIdAndUpdate(notification.profileId, {
      $inc: { unreadNotifications: -1 }
    });
  }

  res.json({ notification });
}));

/**
 * Mark all notifications as read
 */
profileRoutes.post('/me/notifications/read-all', asyncHandler(async (req, res) => {
  const { profileId } = req.body;

  await Notification.updateMany(
    {
      profileId,
      'deliveryStatus.inApp.readAt': { $exists: false }
    },
    {
      $set: {
        'deliveryStatus.inApp.readAt': new Date(),
        readAt: new Date(),
        status: 'read'
      }
    }
  );

  await UserProfile.findByIdAndUpdate(profileId, {
    $set: { unreadNotifications: 0 }
  });

  res.json({ success: true });
}));

/**
 * Update notification preferences
 */
profileRoutes.patch('/me/preferences', asyncHandler(async (req, res) => {
  const { profileId, notificationPreferences, preferredTheme } = req.body;

  const profile = await UserProfile.findById(profileId);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  if (notificationPreferences) {
    profile.notificationPreferences = {
      ...profile.notificationPreferences,
      ...notificationPreferences
    };
  }

  if (preferredTheme) {
    profile.preferredTheme = preferredTheme;
  }

  await profile.save();

  res.json({ profile });
}));

/**
 * Get dashboard summary
 */
profileRoutes.get('/me/dashboard', asyncHandler(async (req, res) => {
  const { phone, email, profileId } = req.query;

  const query = profileId ? { _id: profileId } : { $or: [{ phone }, { email: email?.toLowerCase() }] };

  const profile = await UserProfile.findOne(query).populate('sessions.counselorId', 'name');
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  const nextSession = profile.getNextSession();
  const recentSessions = profile.sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 3);

  const unreadNotifications = await Notification.countDocuments({
    profileId: profile._id,
    'deliveryStatus.inApp.readAt': { $exists: false }
  });

  res.json({
    profile: {
      name: profile.name,
      profileCompleteness: profile.profileCompleteness,
      journeyStatus: profile.journeyStatus,
      preferredTheme: profile.preferredTheme
    },
    nextSession,
    recentSessions,
    stats: {
      totalSessions: profile.totalSessionsBooked,
      completedSessions: profile.totalSessionsCompleted,
      sessionsRemaining: profile.sessionsRemaining,
      totalPaid: profile.totalAmountPaid,
      amountDue: profile.totalAmountDue
    },
    unreadNotifications,
    paymentOverdue: profile.isPaymentOverdue()
  });
}));

export default profileRoutes;
