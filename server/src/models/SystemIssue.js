import mongoose from 'mongoose';

const systemIssueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['server', 'payment', 'database', 'api', 'security'],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    title: { type: String, required: true },
    message: String,
    path: String,
    method: String,
    requestId: String,
    stack: String,
    resolvedAt: Date
  },
  { timestamps: true }
);

systemIssueSchema.index({ createdAt: -1 });

export const SystemIssue = mongoose.model('SystemIssue', systemIssueSchema);
