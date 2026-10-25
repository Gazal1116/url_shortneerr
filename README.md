# Shortly — URL Shortener with Click Analytics

Bitly-style MERN app: short codes, fast 302 redirects, async click logging, and an analytics dashboard (device, browser, referrer, country).

## Stack

- **Frontend:** React 18+ (Vite), Tailwind CSS, Recharts, qrcode.react, Axios
- **Backend:** Node.js, Express, Mongoose, JWT, helmet, express-rate-limit
- **Database:** MongoDB (local or Atlas)

## Features

- Shorten URLs (anonymous or authenticated)
- Custom aliases, expiry, click limits, password protection, one-time links
- Fast redirect (`GET /s/:code`) with unique index + in-memory cache
- Non-blocking click analytics (UA, referrer, geoip-lite, hashed IP)
- Dashboard: search, enable/disable, delete, bulk actions, QR download
- Analytics charts: clicks over time, devices, browsers, referrers, countries
- Rate limiting, Helmet, destination URL validation (SSRF guard)

## Quick start (Mac)

### Prerequisites (one-time)

1. Install **Homebrew**: https://brew.sh  
2. Install **Node.js** and **MongoDB**:

```bash
brew install node
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Confirm:

```bash
node -v    # should print v18+ or v20+
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Get the code

- Clone from GitHub: `git clone <repo-url> && cd url_shortner`  
- Or unzip the project folder and `cd` into it.

### Run backend (Terminal 1)

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

API: http://localhost:5000  

### Run frontend (Terminal 2)

```bash
cd client
cp .env.example .env
yarn install
# if yarn is missing: npm install -g yarn
# if yarn fails: npm install && npm run dev
yarn dev
```

App: **http://localhost:5173**

Open that URL in the browser. Short links look like `http://localhost:5000/s/your-name`.

## Key API routes

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | JWT login |
| `POST` | `/api/urls` | Create short link (auth optional) |
| `GET` | `/api/urls` | List user’s links |
| `GET` | `/api/urls/:id/analytics` | Aggregations |
| `POST` | `/api/urls/:code/verify` | Password unlock |
| `GET` | `/s/:code` | **Hot path** — 302 redirect + async click log |

## Design choices (interview angles)

- **Codes:** 7-char base62 via `crypto.randomBytes` (~3.5×10¹² keyspace); retries on collision; custom aliases validated and uniqueness-checked.
- **302 not 301:** temporary redirect so browsers don’t permanently cache; analytics and password/expiry changes stay accurate.
- **Speed:** unique index on `code` + in-memory LRU cache; click write via `setImmediate` after `res.redirect`.
- **Abuse:** rate limits, Helmet, block private IPs / localhost destinations.

## Deployment sketch

1. Backend → Render/Railway with MongoDB Atlas; set `BASE_URL`, `CLIENT_URL`, `JWT_SECRET`.
2. Point a short custom domain (A/CNAME) at the API; enable HTTPS.
3. Frontend → Vercel on a dashboard subdomain; root domain serves redirects.
4. Keep rate limiting and URL validation on in production.

## Project layout

```
server/src/   Express API, models, redirect hot path
client/src/   React dashboard & landing page
```
<!-- Project documentation -->
