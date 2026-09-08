/**
 * Automatic weekly database backup, uploaded to Cloudinary as a raw file.
 *
 * Why this exists: the admin-panel "Download Backup" buttons (adminRoutes.js
 * /backup/json and /backup/excel) are only as good as someone remembering to
 * click them. This runs the same export automatically once a week and stores
 * it in the same Cloudinary account already used for CMS images — no extra
 * cost, no extra service to manage. It only activates when Cloudinary is
 * configured; if it isn't, this quietly does nothing rather than crashing
 * startup, exactly like the CMS image-upload path already does.
 *
 * Retention: keeps the last 8 weekly backups in Cloudinary and deletes older
 * ones, so this never grows unbounded on a free-tier account.
 */

import cron from 'node-cron';
import { cloudinaryConfigured } from '../config/env.js';
import { collectBackupData } from './backupService.js';
import { uploadRawBuffer } from './cloudinaryStorage.js';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger.js';

const BACKUP_FOLDER = 'neurocogno/backups';
const MAX_BACKUPS_TO_KEEP = 8;

async function pruneOldBackups() {
  try {
    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: `${BACKUP_FOLDER}/`,
      max_results: 100
    });
    const sorted = [...resources].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const toDelete = sorted.slice(MAX_BACKUPS_TO_KEEP);
    for (const resource of toDelete) {
      // eslint-disable-next-line no-await-in-loop
      await cloudinary.uploader.destroy(resource.public_id, { resource_type: 'raw' }).catch(() => {});
    }
  } catch (error) {
    logger.warn({ err: error }, 'Weekly backup: failed to prune old backups (non-fatal)');
  }
}

export async function runWeeklyBackup() {
  if (!cloudinaryConfigured()) {
    logger.info('Weekly backup skipped: Cloudinary not configured.');
    return { skipped: true };
  }

  try {
    const data = await collectBackupData();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const buffer = Buffer.from(JSON.stringify({ generatedAt: new Date().toISOString(), data }, null, 2));

    const result = await uploadRawBuffer(buffer, {
      folder: BACKUP_FOLDER,
      publicId: `auto-backup-${stamp}`
    });

    await pruneOldBackups();

    logger.info({ url: result.url }, 'Weekly automatic backup uploaded to Cloudinary.');
    return { ok: true, url: result.url };
  } catch (error) {
    logger.error({ err: error }, 'Weekly automatic backup failed.');
    return { ok: false, error: error.message };
  }
}

/**
 * Schedules the weekly backup: every Sunday at 03:00 server time. Call once
 * from server.js during bootstrap. Safe to call even when Cloudinary isn't
 * configured — the job itself no-ops in that case (see runWeeklyBackup above).
 */
export function scheduleWeeklyBackup() {
  cron.schedule('0 3 * * 0', () => {
    runWeeklyBackup();
  });
  logger.info('Weekly automatic backup scheduled (Sundays 03:00 server time).');
}
