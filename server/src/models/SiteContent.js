import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema(
  {
    // NOT unique: `slotKey` (below) plus the compound index on
    // {section,type,placement,order} are the real identity for a CMS slot.
    // `key` used to be uniquely constrained on its own, which is exactly what
    // caused `E11000 duplicate key error ... key_1 dup key: { key: "homepage.hero.image" }`
    // in production: a save correctly matched by slotKey but collided with a
    // leftover row from before slotKey existed that still held the same
    // descriptive key text. Kept indexed (non-unique) for lookups/display.
    key: { type: String, required: true, trim: true, lowercase: true, index: true },
    slotKey: { type: String, required: true, trim: true, lowercase: true },
    section: {
      type: String,
      required: true,
      enum: ['homepage', 'insights', 'workshops', 'collaborations', 'services', 'contact', 'global'],
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['image', 'carousel_item', 'video', 'text', 'contact', 'link', 'setting'],
      index: true
    },
    label: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    placement: { type: String, trim: true, maxlength: 180, default: '' },
    title: { type: String, trim: true, maxlength: 180, default: '' },
    subtitle: { type: String, trim: true, maxlength: 300, default: '' },
    body: { type: String, trim: true, maxlength: 2000, default: '' },
    value: { type: String, trim: true, maxlength: 1200, default: '' },
    url: { type: String, trim: true, maxlength: 1200, default: '' },
    imageUrl: { type: String, trim: true, maxlength: 1200, default: '' },
    alt: { type: String, trim: true, maxlength: 180, default: '' },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

siteContentSchema.index({ section: 1, type: 1, isActive: 1, order: 1 });
siteContentSchema.index({ section: 1, type: 1, placement: 1, order: 1 }, { unique: true });
siteContentSchema.index({ slotKey: 1 }, { unique: true });
siteContentSchema.pre('validate', function setSlotKey(next) {
  const placement = String(this.placement || 'default').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  this.slotKey = [this.section, this.type, placement, Number(this.order || 0)].join(':');
  next();
});

siteContentSchema.index({ label: 'text', title: 'text', placement: 'text', description: 'text' });

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);

