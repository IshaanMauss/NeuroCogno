import ExcelJS from 'exceljs';
import { Lead } from '../models/Lead.js';
import { Payment } from '../models/Payment.js';
import { SiteContent } from '../models/SiteContent.js';
import { SystemIssue } from '../models/SystemIssue.js';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { VisitorEvent } from '../models/VisitorEvent.js';
import { WebhookEvent } from '../models/WebhookEvent.js';

// Collections included in a full backup. `User` is included WITHOUT its
// passwordHash field — a backup file is something admins may download,
// email, or store in Cloudinary, and password hashes (even bcrypt ones)
// should never leave the database in an exported file.
const COLLECTIONS = [
  { name: 'leads', model: Lead },
  { name: 'payments', model: Payment },
  { name: 'sitecontents', model: SiteContent },
  { name: 'systemissues', model: SystemIssue },
  { name: 'users', model: User, projection: '-passwordHash' },
  { name: 'userprofiles', model: UserProfile },
  { name: 'visitorevents', model: VisitorEvent },
  { name: 'webhookevents', model: WebhookEvent }
];

/**
 * Pulls every document from every collection listed above. Used as the
 * shared data source for both the JSON and Excel backup exports, and for
 * the scheduled automatic backup job (see services/backupSchedule.js).
 */
export async function collectBackupData() {
  const data = {};
  for (const { name, model, projection } of COLLECTIONS) {
    // eslint-disable-next-line no-await-in-loop
    data[name] = await model.find({}, projection).lean();
  }
  return data;
}

function flattenValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    // ObjectIds, nested objects/arrays: render as compact JSON so the sheet
    // stays readable in Excel instead of showing "[object Object]".
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return value;
}

/**
 * Builds an .xlsx workbook with one tab per collection. Column set for each
 * tab is derived from the union of keys seen across that collection's
 * documents, so it stays accurate even as the schema evolves.
 */
export async function buildBackupWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NeuroCogno Admin Backup';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Collection', key: 'collection', width: 28 },
    { header: 'Document Count', key: 'count', width: 18 }
  ];
  summarySheet.getRow(1).font = { bold: true };

  for (const [name, docs] of Object.entries(data)) {
    summarySheet.addRow({ collection: name, count: docs.length });

    const sheet = workbook.addWorksheet(name.slice(0, 31)); // Excel tab name limit
    if (docs.length === 0) {
      sheet.addRow(['(no documents)']);
      continue;
    }

    const columns = new Set();
    for (const doc of docs) {
      Object.keys(doc).forEach((key) => columns.add(key));
    }
    const columnList = [...columns];

    sheet.columns = columnList.map((key) => ({ header: key, key, width: Math.min(40, Math.max(12, key.length + 4)) }));
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnList.length } };

    for (const doc of docs) {
      const row = {};
      for (const key of columnList) {
        row[key] = flattenValue(doc[key]);
      }
      sheet.addRow(row);
    }
  }

  return workbook;
}
