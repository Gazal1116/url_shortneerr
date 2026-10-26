require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const { redirect } = require('./controllers/redirectController');

const app = express();
const PORT = process.env.PORT || 5001;

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '16kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many links created. Slow down.' },
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Chrome DevTools probes this on localhost — answer so it doesn't 404/CSP-noise
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.status(204).end();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Shortly API',
    health: '/api/health',
    dashboard: process.env.CLIENT_URL || 'http://localhost:5173',
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/urls', createLimiter, urlRoutes);

// Hot path — branded short links: /s/:code
app.get('/s/:code', redirectLimiter, redirect);

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
