#!/usr/bin/env node
/**
 * One-time migration: copy every collection from your LOCAL MongoDB into your
 * Atlas cluster, so you can point the live app at a real cloud database
 * before deploying (Render/Vercel/etc. cannot reach a database on your own
 * laptop).
 *
 * Safety model, same philosophy as dedupe-site-content.mjs:
 *   - Dry run by default: connects to both databases, reports what it would
 *     copy, changes nothing.
 *   - --apply actually copies documents, using an upsert-by-_id so it is
 *     safe to re-run (re-running never duplicates anything).
 *   - NEVER deletes or modifies anything in the source (local) database.
 *   - Refuses to touch a target collection that already has documents,
 *     unless you pass --force (protects against accidentally overwriting
 *     real Atlas data with local test data by mistake).
 *
 * Usage:
 *   node scripts/migrate-to-atlas.mjs --target "<atlas connection string>"
 *   node scripts/migrate-to-atlas.mjs --target "<atlas connection string>" --apply
 *   node scripts/migrate-to-atlas.mjs --target "<atlas connection string>" --apply --force
 *
 * The source database is read from MONGODB_URI in your .env (your local
 * MongoDB) unless --source is passed explicitly.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');

function argValue(name) {
  const flag = `--${name}=`;
  const inline = args.find((a) => a.startsWith(flag));
  if (inline) return inline.slice(flag.length);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  return null;
}

const SOURCE_URI = argValue('source') || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neurocogno';
const TARGET_URI = argValue('target') || process.env.ATLAS_URI;

if (!TARGET_URI) {
  console.error('Missing target. Pass --target "<your Atlas connection string>" (or set ATLAS_URI in .env).');
  process.exit(1);
}

const COLLECTIONS = ['leads', 'payments', 'sitecontents', 'systemissues', 'users', 'userprofiles', 'visitorevents', 'webhookevents'];

async function main() {
  console.log(`Source (local): ${SOURCE_URI}`);
  console.log(`Target (Atlas): ${TARGET_URI.replace(/:([^:@]+)@/, ':****@')}\n`);

  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log('Connected to both databases.\n');

  const plan = [];

  for (const name of COLLECTIONS) {
    const sourceCount = await sourceConn.db.collection(name).countDocuments().catch(() => 0);
    const targetCount = await targetConn.db.collection(name).countDocuments().catch(() => 0);
    plan.push({ name, sourceCount, targetCount });
  }

  console.log('Collection            Local docs   Atlas docs (already there)');
  for (const { name, sourceCount, targetCount } of plan) {
    console.log(`${name.padEnd(22)} ${String(sourceCount).padEnd(12)} ${targetCount}`);
  }
  console.log('');

  const blockedByExisting = plan.filter((p) => p.targetCount > 0 && p.sourceCount > 0);
  if (blockedByExisting.length && !FORCE) {
    console.log('These Atlas collections already contain documents:');
    for (const p of blockedByExisting) console.log(`  - ${p.name} (${p.targetCount} existing document(s))`);
    console.log('\nRefusing to copy into them without --force, to avoid mixing/overwriting real Atlas data by');
    console.log('accident. Review what is already there, then re-run with --force if you are sure, or delete');
    console.log('those Atlas documents yourself first if they were just test placeholders.');
    if (!APPLY) {
      console.log('\n(This was a dry run anyway — no changes were made regardless.)');
    }
    await sourceConn.close();
    await targetConn.close();
    process.exit(APPLY ? 1 : 0);
  }

  if (!APPLY) {
    console.log('--- DRY RUN --- no changes made. Re-run with --apply to actually copy this data.');
    await sourceConn.close();
    await targetConn.close();
    return;
  }

  for (const { name, sourceCount } of plan) {
    if (sourceCount === 0) {
      console.log(`Skipping ${name} (nothing to copy).`);
      continue;
    }
    console.log(`Copying ${name} (${sourceCount} document(s))...`);
    const docs = await sourceConn.db.collection(name).find({}).toArray();
    const targetCollection = targetConn.db.collection(name);
    let copied = 0;
    const failures = [];
    for (const doc of docs) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await targetCollection.replaceOne({ _id: doc._id }, doc, { upsert: true });
        copied += 1;
      } catch (error) {
        // Do not let one bad document (e.g. a duplicate username/email on a
        // unique index) abort the whole migration. Record it and keep going
        // so every other document still gets copied; the admin can resolve
        // the specific conflict by hand afterward.
        failures.push({ id: String(doc._id), error: error.message });
      }
    }
    console.log(`  Done: ${copied} document(s) upserted into Atlas.`);
    if (failures.length) {
      console.log(`  ${failures.length} document(s) could NOT be copied (shown below) — everything else in this collection succeeded:`);
      for (const f of failures) {
        console.log(`    _id=${f.id}: ${f.error}`);
      }
    }
  }

  console.log('\nMigration complete. Next steps:');
  console.log('  1. Update .env: set MONGODB_URI to your Atlas connection string.');
  console.log('  2. Restart your backend so it connects to Atlas and re-syncs indexes.');
  console.log('  3. Verify the admin panel shows your real data before deploying.');

  await sourceConn.close();
  await targetConn.close();
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
