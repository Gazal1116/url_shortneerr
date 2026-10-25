const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    longUrl: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customAlias: { type: String, default: null },
    title: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    passwordHash: { type: String, default: null, select: false },
    clickLimit: { type: Number, default: null },
    clicks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    oneTimeUse: { type: Boolean, default: false },
  },
  { timestamps: true }
);

urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ expiresAt: 1 }, { sparse: true });

module.exports = mongoose.model('Url', urlSchema);
