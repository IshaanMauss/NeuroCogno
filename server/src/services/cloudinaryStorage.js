/**
 * Cloudinary-backed image storage for CMS uploads.
 *
 * Why this exists: local-disk uploads (see adminRoutes.js normalizeUploadedImage/
 * uploadRoot) do not survive most modern hosting platforms (Vercel's filesystem is
 * read-only outside /tmp; Render/Railway free tiers wipe disk on redeploy). Cloudinary
 * gives every uploaded image a permanent CDN URL that survives redeploys and server
 * restarts regardless of host, which is what actually matters for CMS media used on a
 * live client site.
 *
 * This module is intentionally optional: if CLOUDINARY_* env vars are not set,
 * `cloudinaryConfigured()` (config/env.js) returns false and the calling route falls
 * back to the original local-disk behavior, so local development without a Cloudinary
 * account keeps working exactly as before.
 */

import { v2 as cloudinary } from 'cloudinary';
import { env, cloudinaryConfigured } from '../config/env.js';

let configured = false;

function ensureConfigured() {
  if (configured || !cloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
  configured = true;
}

/**
 * Upload an already-validated/normalized image buffer to Cloudinary.
 * The caller (adminRoutes.js) has already verified real image bytes via
 * file-type and re-encoded/compressed via Sharp before this is called, so this
 * function does no further validation itself.
 *
 * @param {Buffer} buffer - final image bytes (webp, already compressed)
 * @param {{ folder?: string, publicId?: string }} options
 * @returns {Promise<{ url: string, publicId: string, bytes: number, width: number, height: number }>}
 */
export function uploadImageBuffer(buffer, options = {}) {
  ensureConfigured();
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET missing)');
  }

  const folder = options.folder || 'neurocogno/site-content';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        resource_type: 'image',
        overwrite: true,
        format: 'webp'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete a previously uploaded image by its Cloudinary public_id. Used when a
 * CMS slot's image is replaced, so old assets don't pile up in the account
 * (mirrors the "replace, don't accumulate" behavior the local-disk path never
 * had either, but is worth doing now that storage isn't free/local).
 * Failures are logged by the caller; this never throws so a cleanup failure
 * never blocks the actual CMS save that already succeeded.
 */
export async function deleteImageByPublicId(publicId) {
  if (!publicId) return { skipped: true };
  ensureConfigured();
  if (!cloudinaryConfigured()) return { skipped: true };
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Extract a Cloudinary public_id we previously stored back out of a secure URL,
 * as a fallback for any CMS records saved before publicId was tracked in
 * metadata. Best-effort only.
 */
export function publicIdFromUrl(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}


/**
 * Upload an arbitrary non-image file (JSON/Excel backups) to Cloudinary as a
 * "raw" resource. Separate from uploadImageBuffer because raw files skip
 * Cloudinary's image pipeline (no format conversion, no transformations) —
 * we want the exact bytes we generated stored and retrievable byte-for-byte.
 * Used by services/backupSchedule.js for the automatic weekly backup.
 *
 * @param {Buffer} buffer
 * @param {{ folder?: string, publicId?: string }} options
 */
export function uploadRawBuffer(buffer, options = {}) {
  ensureConfigured();
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET missing)');
  }

  const folder = options.folder || 'neurocogno/backups';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        resource_type: 'raw',
        overwrite: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes
        });
      }
    );
    uploadStream.end(buffer);
  });
}

