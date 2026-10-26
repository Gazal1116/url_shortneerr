const Url = require('../models/Url');
const Click = require('../models/Click');
const { parseRequestMeta } = require('../utils/parseRequestMeta');
const { urlCache } = require('../middleware/cache');

/**
 * Hot path: single indexed lookup by code, 302 redirect, async click log.
 * 302 (temporary) so browsers/CDNs don't cache forever — important for
 * analytics accuracy and password/expiry/limit changes.
 */
async function redirect(req, res) {
  const { code } = req.params;

  try {
    let urlDoc = urlCache.get(code);

    if (!urlDoc) {
      urlDoc = await Url.findOne({ code }).select('+passwordHash').lean();
      if (urlDoc) {
        urlCache.set(code, urlDoc);
      }
    }

    if (!urlDoc || !urlDoc.isActive) {
      return res.status(404).send(notFoundPage());
    }

    if (urlDoc.expiresAt && new Date(urlDoc.expiresAt) < new Date()) {
      return res.status(410).send(gonePage('This link has expired.'));
    }

    if (urlDoc.clickLimit != null && urlDoc.clicks >= urlDoc.clickLimit) {
      return res.status(410).send(gonePage('This link has reached its click limit.'));
    }

    if (urlDoc.passwordHash) {
      const unlock = req.query.unlock;
      if (!isValidUnlock(unlock, code)) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(302, `${clientUrl}/unlock/${code}`);
      }
    }

    // Respond immediately — do not await analytics
    res.redirect(302, urlDoc.longUrl);

    setImmediate(() => {
      logClick(urlDoc, req).catch((err) => {
        console.error('Click log failed:', err.message);
      });
    });
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Server error');
  }
}

function isValidUnlock(token, code) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [tokCode, expiryStr] = decoded.split(':');
    return tokCode === code && Number(expiryStr) > Date.now();
  } catch {
    return false;
  }
}

async function logClick(urlDoc, req) {
  const meta = parseRequestMeta(req);

  await Click.create({
    urlId: urlDoc._id,
    timestamp: new Date(),
    ...meta,
  });

  const update = { $inc: { clicks: 1 } };
  if (urlDoc.oneTimeUse) {
    update.$set = { isActive: false };
  }

  const updated = await Url.findByIdAndUpdate(urlDoc._id, update, {
    new: true,
  }).lean();

  if (updated) {
    urlCache.set(urlDoc.code, {
      ...urlDoc,
      clicks: updated.clicks,
      isActive: updated.isActive,
    });
  } else {
    urlCache.delete(urlDoc.code);
  }
}

function notFoundPage() {
  return `<!DOCTYPE html><html><head><title>Link not found</title>
<style>body{font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f1419;color:#e7ecf3}
.card{text-align:center}h1{font-size:1.5rem}a{color:#3d9cf0}</style></head>
<body><div class="card"><h1>Short link not found</h1>
<p>This code does not exist or was removed.</p></div></body></html>`;
}

function gonePage(message) {
  return `<!DOCTYPE html><html><head><title>Link unavailable</title>
<style>body{font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f1419;color:#e7ecf3}
.card{text-align:center}h1{font-size:1.5rem}</style></head>
<body><div class="card"><h1>Link unavailable</h1>
<p>${message}</p></div></body></html>`;
}

module.exports = { redirect };
