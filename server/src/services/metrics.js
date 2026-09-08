import { Lead } from '../models/Lead.js';
import { Payment } from '../models/Payment.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { VisitorEvent } from '../models/VisitorEvent.js';
import { dbHealth } from '../config/db.js';

export async function getDashboardMetrics() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    surveyCallbacks,
    submittedAppointments,
    collaborationInquiries,
    incompleteLeads,
    paidClients,
    confirmedClients,
    archivedLeads,
    failedPayments,
    activeIssues,
    traffic24h,
    uniqueVisitors
  ] = await Promise.all([
    Lead.countDocuments({ lifecycleStatus: { $ne: 'archived' }, source: 'survey_popup', status: 'survey_callback' }),
    Lead.countDocuments({ lifecycleStatus: { $ne: 'archived' }, source: 'appointment_form', status: { $in: ['submitted', 'paid'] } }),
    Lead.countDocuments({ lifecycleStatus: { $ne: 'archived' }, source: 'collaboration_inquiry', status: { $in: ['submitted', 'paid'] } }),
    Lead.countDocuments({ lifecycleStatus: { $ne: 'archived' }, status: 'draft', $or: [{ phone: { $ne: '' } }, { email: { $ne: '' } }] }),
    Lead.countDocuments({ lifecycleStatus: { $ne: 'archived' }, paymentStatus: 'paid' }),
    Lead.countDocuments({ lifecycleStatus: { $ne: 'archived' }, $or: [{ lifecycleStatus: 'confirmed' }, { paymentStatus: 'paid' }] }),
    Lead.countDocuments({ lifecycleStatus: 'archived' }),
    Payment.countDocuments({ status: { $in: ['failed', 'signature_failed'] } }),
    SystemIssue.countDocuments({ resolvedAt: { $exists: false } }),
    VisitorEvent.countDocuments({ createdAt: { $gte: since24h } }),
    VisitorEvent.distinct('visitorId', { createdAt: { $gte: since24h } }).then((ids) => ids.length)
  ]);

  return {
    surveyCallbacks,
    submittedAppointments,
    collaborationInquiries,
    incompleteLeads,
    paidClients,
    confirmedClients,
    archivedLeads,
    failedPayments,
    activeIssues,
    traffic24h,
    uniqueVisitors,
    database: dbHealth()
  };
}
