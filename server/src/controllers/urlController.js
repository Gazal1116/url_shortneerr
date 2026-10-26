const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Url = require('../models/Url');
const Click = require('../models/Click');
const {
  generatePrettyCode,
  isValidAlias,
  normalizeAlias,
} = require('../utils/generateCode');
const { slugFromUrl, withUniqueSuffix } = require('../utils/slugFromUrl');
const { validateDestinationUrl } = require('../utils/validateUrl');
const { urlCache } = require('../middleware/cache');

const BASE_URL = () => process.env.BASE_URL || 'http://localhost:5000';

function shortPath(code) {
  return `/s/${code}`;
}

function toPublicUrl(doc) {
  const path = shortPath(doc.code);
  return {
    id: doc._id,
    code: doc.code,
    path,
    shortUrl: `${BASE_URL()}${path}`,
    longUrl: doc.longUrl,
    title: doc.title,
    customAlias: doc.customAlias,
    expiresAt: doc.expiresAt,
    clickLimit: doc.clickLimit,
    clicks: doc.clicks,
    isActive: doc.isActive,
    oneTimeUse: doc.oneTimeUse,
    hasPassword: Boolean(doc.passwordHash),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const createValidators = [
  body('longUrl').notEmpty().withMessage('longUrl is required'),
  body('customAlias')
    .optional({ nullable: true, checkFalsy: true })
    .custom((v) => !v || isValidAlias(normalizeAlias(v)))
    .withMessage(
      'Alias: 2–32 chars, lowercase letters, numbers, - or _ (e.g. docs-brief)'
    ),
  body('clickLimit')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('clickLimit must be a positive integer'),
  body('expiresAt')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('expiresAt must be a valid date'),
];

async function createUniqueCode(preferred, longUrl) {
  // Explicit custom alias — fail if taken
  if (preferred) {
    const taken = await Url.exists({ code: preferred });
    if (taken) {
      const err = new Error('Alias already taken');
      err.status = 409;
      throw err;
    }
    return preferred;
  }

  // Derive a name from the destination URL (e.g. docs-google-document)
  const base = slugFromUrl(longUrl);
  if (base && isValidAlias(base)) {
    for (let i = 0; i < 25; i += 1) {
      const candidate = withUniqueSuffix(base, i);
      if (!isValidAlias(candidate)) continue;
      // eslint-disable-next-line no-await-in-loop
      const taken = await Url.exists({ code: candidate });
      if (!taken) return candidate;
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const code = generatePrettyCode();
    const taken = await Url.exists({ code });
    if (!taken) return code;
  }
  const err = new Error('Could not generate unique code; please retry');
  err.status = 500;
  throw err;
}

async function createUrl(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    longUrl,
    customAlias,
    expiresAt,
    password,
    clickLimit,
    title,
    oneTimeUse,
  } = req.body;

  const validation = await validateDestinationUrl(longUrl);
  if (!validation.ok) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const alias = customAlias ? normalizeAlias(customAlias) : null;
    if (alias && !isValidAlias(alias)) {
      return res.status(400).json({
        message: 'Invalid alias. Use lowercase letters, numbers, - or _',
      });
    }
    const code = await createUniqueCode(alias, validation.url);

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(String(password), 10);
    }

    const url = await Url.create({
      code,
      longUrl: validation.url,
      userId: req.user?._id || null,
      customAlias: alias,
      title: title || '',
      expiresAt: expiresAt || null,
      passwordHash,
      clickLimit: clickLimit || null,
      oneTimeUse: Boolean(oneTimeUse),
    });

    res.status(201).json({ url: toPublicUrl(url) });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Failed to create URL' });
  }
}

async function listUrls(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim();
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (search) {
    filter.$or = [
      { code: new RegExp(search, 'i') },
      { longUrl: new RegExp(search, 'i') },
      { title: new RegExp(search, 'i') },
      { customAlias: new RegExp(search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Url.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Url.countDocuments(filter),
  ]);

  res.json({
    urls: items.map(toPublicUrl),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
}

async function getUrl(req, res) {
  const url = await Url.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).select('+passwordHash');

  if (!url) {
    return res.status(404).json({ message: 'URL not found' });
  }

  res.json({ url: toPublicUrl(url) });
}

async function updateUrl(req, res) {
  const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
  if (!url) {
    return res.status(404).json({ message: 'URL not found' });
  }

  const { longUrl, title, expiresAt, clickLimit, isActive, password, oneTimeUse } =
    req.body;

  if (longUrl !== undefined) {
    const validation = await validateDestinationUrl(longUrl);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.error });
    }
    url.longUrl = validation.url;
  }

  if (title !== undefined) url.title = title;
  if (expiresAt !== undefined) url.expiresAt = expiresAt || null;
  if (clickLimit !== undefined) url.clickLimit = clickLimit || null;
  if (isActive !== undefined) url.isActive = Boolean(isActive);
  if (oneTimeUse !== undefined) url.oneTimeUse = Boolean(oneTimeUse);

  if (password === '') {
    url.passwordHash = null;
  } else if (password) {
    url.passwordHash = await bcrypt.hash(String(password), 10);
  }

  await url.save();
  urlCache.delete(url.code);

  res.json({ url: toPublicUrl(url) });
}

async function deleteUrl(req, res) {
  const url = await Url.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!url) {
    return res.status(404).json({ message: 'URL not found' });
  }

  urlCache.delete(url.code);
  Click.deleteMany({ urlId: url._id }).catch(() => {});

  res.json({ message: 'URL deleted' });
}

async function bulkAction(req, res) {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: 'ids array is required' });
  }
  if (!['disable', 'enable', 'delete'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const filter = { _id: { $in: ids }, userId: req.user._id };

  if (action === 'delete') {
    const urls = await Url.find(filter).select('code');
    await Url.deleteMany(filter);
    urls.forEach((u) => urlCache.delete(u.code));
    await Click.deleteMany({ urlId: { $in: ids } });
    return res.json({ message: `Deleted ${urls.length} link(s)` });
  }

  const isActive = action === 'enable';
  const result = await Url.updateMany(filter, { $set: { isActive } });
  const urls = await Url.find(filter).select('code');
  urls.forEach((u) => urlCache.delete(u.code));

  res.json({
    message: `${action}d ${result.modifiedCount} link(s)`,
  });
}

async function getAnalytics(req, res) {
  const url = await Url.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!url) {
    return res.status(404).json({ message: 'URL not found' });
  }

  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return res.status(400).json({
      message: 'Invalid date range',
    });
  }

  if (from > to) {
    return res.status(400).json({
      message: 'Start date cannot be after end date',
    });
  }

  const match = {
    urlId: url._id,
    timestamp: { $gte: from, $lte: to },
  };

  const [
    clicksOverTime,
    topReferrers,
    devices,
    browsers,
    countries,
    totalClicks,
  ] = await Promise.all([
    Click.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]),
    Click.aggregate([
      { $match: match },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { referrer: '$_id', count: 1, _id: 0 } },
    ]),
    Click.aggregate([
      { $match: match },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]),
    Click.aggregate([
      { $match: match },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]),
    Click.aggregate([
      { $match: match },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { country: '$_id', count: 1, _id: 0 } },
    ]),
    Click.countDocuments(match),
  ]);

  res.json({
    url: toPublicUrl(url),
    analytics: {
      totalClicks,
      clicksOverTime,
      topReferrers,
      devices,
      browsers,
      countries,
    },
  });
}

async function verifyPassword(req, res) {
  const { password } = req.body;
  const url = await Url.findOne({ code: req.params.code }).select(
    '+passwordHash'
  );

  if (!url || !url.isActive) {
    return res.status(404).json({ message: 'Link not found' });
  }

  if (!url.passwordHash) {
    return res.json({
      ok: true,
      longUrl: url.longUrl,
      shortUrl: `${BASE_URL()}${shortPath(url.code)}`,
    });
  }

  if (!password || !(await bcrypt.compare(String(password), url.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  // Issue a short-lived unlock token stored client-side for the redirect hop
  const unlockToken = Buffer.from(
    `${url.code}:${Date.now() + 5 * 60 * 1000}`
  ).toString('base64url');

  res.json({
    ok: true,
    unlockToken,
    redirectPath: `${shortPath(url.code)}?unlock=${unlockToken}`,
  });
}

async function checkAlias(req, res) {
  const alias = normalizeAlias(req.query.alias || '');
  if (!alias || !isValidAlias(alias)) {
    return res.status(400).json({ available: false, message: 'Invalid alias' });
  }
  const taken = await Url.exists({ code: alias });
  res.json({ available: !taken });
}

module.exports = {
  createUrl,
  listUrls,
  getUrl,
  updateUrl,
  deleteUrl,
  bulkAction,
  getAnalytics,
  verifyPassword,
  checkAlias,
  createValidators,
  toPublicUrl,
};
