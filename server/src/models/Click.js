const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },
    referrer: { type: String, default: 'direct' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'unknown' },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    country: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    ipHash: { type: String, default: null },
  },
  { timestamps: false }
);

clickSchema.index({ urlId: 1, timestamp: -1 });

module.exports = mongoose.model('Click', clickSchema);
