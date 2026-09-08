#!/usr/bin/env node
/**
 * One-time cleanup: find and remove duplicate SiteContent documents.
 *
 * Why this exists: `models/SiteContent.js` has a compound unique index on
 * {section, type, placement, order} (the real identity for a CMS slot, via
 * `slotKey`). Documents created before `slotKey` existed, or before this
 * exact placement text was settled on, can end up as orphaned duplicates that
 * never got cleaned up — which is exactly what produced:
 *   E11000 duplicate key error ... section_1_type_1_placement_1_order_1
 *   dup key: { section: "homepage", type: "image", placement: "Hero right visual area", order: 0 }
 * This script finds every group of documents sharing the same
 * {section, type, placement, order}, keeps the best one, and removes the
 * rest — after writing everything it's about to delete to a backup JSON file
 * first, so nothing is ever lost irreversibly.
 *
 * Usage:
 *   node scripts/dedupe-site-content.mjs            # dry run — shows what it WOULD do, changes nothing
 *   node scripts/dedupe-site-content.mjs --apply     # actually deletes duplicates (after writing a backup)
 *
 * Safe to run any number of times — once there are no duplicate groups left,
 * it does nothing.
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the same .env the server uses (repo root).
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APPLY = process.argv.includes('--apply');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neurocogno';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'neurocogno';

// Minimal schema mirror — enough to read/write the fields this script needs
// without importing the full app (which would pull in env validation, etc).
const siteContentSchema = new mongoose.Schema(
  {
    key: String,
    slotKey: String,
    section: String,
    type: String,
    placement: String,
    order: Number,
    isActive: Boolean,
    imageUrl: String,
    url: String,
    value: String,
    body: String,
    title: String
  },
  { timestamps: true, strict: false }
);

const SiteContent = mongoose.model('SiteContent', siteContentSchema, 'sitecontents');

function slotKeyFor(doc) {
  const section = String(doc.section || '').trim().toLowerCase();
  const type = String(doc.type || '').trim().toLowerCase();
  const placement = String(doc.placement || 'default').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const order = Number(doc.order || 0);
  return [section, type, placement, Number.isFinite(order) ? order : 0].join(':');
}

// How "complete" a document is — used to decide which duplicate to keep.
// Prefers the one that actually has content over an empty placeholder.
function contentScore(doc) {
  let score = 0;
  if (doc.imageUrl) score += 4;
  if (doc.url) score += 2;
  if (doc.value) score += 2;
  if (doc.body) score += 1;
  if (doc.title) score += 1;
  if (doc.isActive) score += 1;
  return score;
}

function pickSurvivor(group) {
  return [...group].sort((a, b) => {
    const scoreDiff = contentScore(b) - contentScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    // Tie-break: keep the most recently updated document.
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  })[0];
}

async function main() {
  console.log(`Connecting to ${MONGODB_URI} (db: ${MONGODB_DB_NAME})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log('Connected.\n');

  const all = await SiteContent.find({}).lean();
  console.log(`Loaded ${all.length} site-content documents.\n`);

  const groups = new Map();
  for (const doc of all) {
    const key = [
      String(doc.section || '').trim(),
      String(doc.type || '').trim(),
      String(doc.placement || '').trim(),
      Number(doc.order || 0)
    ].join('|||');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
  }

  const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);

  const toDelete = [];
  const toFixSlotKey = [];

  if (duplicateGroups.length === 0) {
    console.log('No duplicate {section, type, placement, order} groups found (no group has more than one document).');
  } else {
    console.log(`Found ${duplicateGroups.length} duplicate slot group(s):\n`);

    for (const group of duplicateGroups) {
      const survivor = pickSurvivor(group);
      const losers = group.filter((doc) => String(doc._id) !== String(survivor._id));

      console.log(`Slot: section="${group[0].section}" type="${group[0].type}" placement="${group[0].placement}" order=${group[0].order}`);
      console.log(`  KEEP   _id=${survivor._id}  key="${survivor.key}"  slotKey="${survivor.slotKey}"  updatedAt=${survivor.updatedAt}`);
      for (const loser of losers) {
        console.log(`  DELETE _id=${loser._id}  key="${loser.key}"  slotKey="${loser.slotKey}"  updatedAt=${loser.updatedAt}`);
        toDelete.push(loser);
      }
      console.log('');
    }
  }

  // Separately from duplicate groups: check EVERY document (including ones that
  // are the only occupant of their {section,type,placement,order} slot) for a
  // stale `slotKey` that no longer matches what today's normalization would
  // compute from its own fields. This is the actual root cause of
  // "E11000 ... section_1_type_1_placement_1_order_1" errors that keep
  // recurring even with zero duplicate documents: the save route looks up the
  // existing row by `slotKey`, misses it because the stored slotKey is stale,
  // and then tries to INSERT a new row that collides with the existing one's
  // raw {section,type,placement,order} on the compound unique index.
  const alreadyFlagged = new Set(toFixSlotKey.map((f) => String(f._id)));
  const survivingIds = new Set(toDelete.map((d) => String(d._id)));
  for (const doc of all) {
    if (survivingIds.has(String(doc._id))) continue; // being deleted anyway
    if (alreadyFlagged.has(String(doc._id))) continue;
    const correctSlotKey = slotKeyFor(doc);
    if (doc.slotKey !== correctSlotKey) {
      toFixSlotKey.push({ _id: doc._id, from: doc.slotKey, to: correctSlotKey });
    }
  }

  if (duplicateGroups.length === 0 && toFixSlotKey.length === 0) {
    console.log('No duplicates and no stale slotKey values found. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log('--- DRY RUN --- no changes made.');
    console.log(`Would delete ${toDelete.length} duplicate document(s).`);
    if (toFixSlotKey.length) {
      console.log(`Would also correct slotKey on ${toFixSlotKey.length} surviving document(s) whose slotKey was stale:`);
      for (const fix of toFixSlotKey) {
        console.log(`  _id=${fix._id}  "${fix.from}" -> "${fix.to}"`);
      }
    }
    console.log('\nRe-run with --apply to actually make these changes (a backup is written first).');
    await mongoose.disconnect();
    return;
  }

  // Write a backup of everything about to be deleted before touching anything.
  const backupDir = path.resolve(__dirname, '../backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `sitecontent-dedupe-backup-${Date.now()}.json`);
  await fs.writeFile(backupPath, JSON.stringify(toDelete, null, 2), 'utf8');
  console.log(`Backed up ${toDelete.length} document(s) about to be deleted to:\n  ${backupPath}\n`);

  const idsToDelete = toDelete.map((doc) => doc._id);
  const deleteResult = await SiteContent.deleteMany({ _id: { $in: idsToDelete } });
  console.log(`Deleted ${deleteResult.deletedCount} duplicate document(s).`);

  for (const fix of toFixSlotKey) {
    await SiteContent.updateOne({ _id: fix._id }, { $set: { slotKey: fix.to } });
  }
  if (toFixSlotKey.length) {
    console.log(`Corrected slotKey on ${toFixSlotKey.length} surviving document(s).`);
  }

  console.log('\nDone. Restart your backend so it re-syncs indexes cleanly on the now-deduplicated collection.');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
