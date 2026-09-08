/**
 * User Profile & Booking Management Schema
 * For counseling session tracking and user journey
 */

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionNumber: { type: Number, required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled'
  },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  counselorName: String,
  duration: { type: Number, default: 60 }, // minutes
  notes: String,
  completedAt: Date,
  cancelledReason: String,
  rescheduledFrom: Date
}, { _id: true });

const userProfileSchema = new mongoose.Schema({
  // Core user info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    unique: true,
    index: true
  },

  // Personal information (from lead)
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  alternatePhone: String,
  alternateEmail: String,

  // Counseling profile
  ageGroup: String,
  primaryConcern: String, // Main reason for seeking counseling
  additionalConcerns: [String],
  preferredCounselorGender: {
    type: String,
    enum: ['male', 'female', 'no_preference'],
    default: 'no_preference'
  },
  preferredLanguage: {
    type: String,
    default: 'English'
  },

  // Booking & session tracking
  totalSessionsBooked: { type: Number, default: 0 },
  totalSessionsCompleted: { type: Number, default: 0 },
  totalSessionsCancelled: { type: Number, default: 0 },
  sessions: [sessionSchema],
  currentPackage: {
    type: String,
    enum: ['single', 'package_3', 'package_5', 'package_10', 'custom'],
    default: 'single'
  },
  sessionsRemaining: { type: Number, default: 0 },

  // Payment tracking
  totalAmountPaid: { type: Number, default: 0 },
  totalAmountDue: { type: Number, default: 0 },
  paymentHistory: [{
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    amount: Number,
    paidAt: Date,
    purpose: String, // 'initial_booking', 'package_3', 'session_addon'
    razorpayPaymentId: String
  }],
  nextPaymentDue: Date,

  // Status & journey
  journeyStatus: {
    type: String,
    enum: [
      'enquiry',           // Just filled form
      'payment_pending',   // Waiting for payment
      'payment_completed', // Paid, waiting for session schedule
      'scheduled',         // First session scheduled
      'in_progress',       // Actively attending sessions
      'on_hold',          // Paused temporarily
      'completed',        // Completed all sessions
      'inactive'          // Inactive for >30 days
    ],
    default: 'enquiry',
    index: true
  },

  // Notifications & preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    reminderBefore24h: { type: Boolean, default: true },
    reminderBefore1h: { type: Boolean, default: true }
  },
  unreadNotifications: { type: Number, default: 0 },

  // App preferences
  preferredTheme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  },
  preferredView: {
    type: String,
    enum: ['mobile', 'desktop'],
    default: 'mobile'
  },

  // Engagement tracking
  lastLoginAt: Date,
  lastSessionAt: Date,
  lastPaymentAt: Date,
  totalLoginCount: { type: Number, default: 0 },
  profileCompleteness: { type: Number, default: 0 }, // 0-100%

  // Medical/consent (optional fields)
  medicalHistory: {
    hasAllergies: Boolean,
    allergiesDetails: String,
    currentMedications: String,
    previousTherapy: Boolean,
    previousTherapyDetails: String,
    emergencyContactName: String,
    emergencyContactPhone: String,
    consentForRecording: Boolean,
    consentForDataSharing: Boolean
  },

  // Feedback & ratings
  averageRating: { type: Number, min: 0, max: 5 },
  totalFeedbackGiven: { type: Number, default: 0 },

  // Referral tracking
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: String,
  referralCount: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },

  // Flags
  isActive: { type: Boolean, default: true },
  isVIP: { type: Boolean, default: false },
  requiresFollowUp: { type: Boolean, default: false },
  requiresUrgentAttention: { type: Boolean, default: false },

  // Metadata
  createdFrom: {
    type: String,
    enum: ['web', 'mobile_app', 'admin'],
    default: 'web'
  },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, {
  timestamps: true,
  collection: 'userprofiles'
});

// Indexes for efficient queries
userProfileSchema.index({ phone: 1 });
userProfileSchema.index({ email: 1 });
userProfileSchema.index({ journeyStatus: 1, updatedAt: -1 });
userProfileSchema.index({ 'sessions.scheduledDate': 1, 'sessions.status': 1 });
userProfileSchema.index({ nextPaymentDue: 1, journeyStatus: 1 });
userProfileSchema.index({ lastSessionAt: 1 });
userProfileSchema.index({ isActive: 1, journeyStatus: 1 });

// Calculate profile completeness
userProfileSchema.methods.calculateCompleteness = function() {
  let score = 0;
  const fields = [
    this.name, this.phone, this.email,
    this.ageGroup, this.primaryConcern,
    this.medicalHistory?.emergencyContactName,
    this.medicalHistory?.emergencyContactPhone,
    this.preferredCounselorGender,
    this.preferredLanguage
  ];

  fields.forEach(field => {
    if (field) score += 100 / fields.length;
  });

  this.profileCompleteness = Math.round(score);
  return this.profileCompleteness;
};

// Get next session
userProfileSchema.methods.getNextSession = function() {
  const now = new Date();
  return this.sessions
    .filter(s => s.status === 'scheduled' && s.scheduledDate > now)
    .sort((a, b) => a.scheduledDate - b.scheduledDate)[0];
};

// Get session history
userProfileSchema.methods.getSessionHistory = function() {
  return this.sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => b.completedAt - a.completedAt);
};

// Check if payment is overdue
userProfileSchema.methods.isPaymentOverdue = function() {
  return this.nextPaymentDue && this.nextPaymentDue < new Date();
};

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);
