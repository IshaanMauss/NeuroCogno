import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import { env, isProduction, allowedClientOrigins } from './config/env.js';
import { connectDb, dbHealth } from './config/db.js';
import { logger } from './config/logger.js';
import { seedAdmins } from './services/adminSeed.js';
import { setSocketServer } from './services/realtime.js';
import { authRoutes } from './routes/authRoutes.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { paymentRoutes } from './routes/paymentRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { devRoutes } from './routes/devRoutes.js';
import { notFound, errorHandler, setupProcessErrorHandlers } from './middleware/errorHandler.js';
import { User } from './models/User.js';
import { SiteContent } from './models/SiteContent.js';
import { scheduleWeeklyBackup } from './services/backupSchedule.js';
import {
  detectSuspiciousPatterns,
  ipFilter,
  sanitizeResponse
} from './middleware/security.js';
import { generalLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: allowedClientOrigins(),
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

setSocketServer(io);

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

io.use(async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const raw = cookies.nc_access;
    const token = raw?.startsWith('s:') ? cookieParser.signedCookie(raw, env.COOKIE_SECRET) : raw;

    // Allow connection without auth for public users (they can join profile rooms with profileId)
    if (!token) {
      // Check if profileId provided for public access
      const profileId = socket.handshake.query.profileId;
      if (profileId) {
        socket.profileId = profileId;
        return next();
      }
      return next(new Error('Unauthorized socket'));
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'neurocogno' });
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user || !user.isActive) return next(new Error('Unauthorized socket'));

    socket.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
});

io.on('connection', (socket) => {
  // Admin users join admin room
  if (socket.user) {
    socket.join('admins');
    logger.info({ userId: socket.user._id, role: socket.user.role }, 'Admin connected to socket');
  }

  // Public users join their profile room
  if (socket.profileId) {
    socket.join(`profile:${socket.profileId}`);
    logger.info({ profileId: socket.profileId }, 'User connected to profile room');
  }

  socket.on('disconnect', () => {
    if (socket.user) {
      logger.info({ userId: socket.user._id }, 'Admin disconnected from socket');
    }
    if (socket.profileId) {
      logger.info({ profileId: socket.profileId }, 'User disconnected from profile room');
    }
  });
});

app.set('trust proxy', 1);

// Enhanced security headers
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
            connectSrc: ["'self'", ...allowedClientOrigins()],
            imgSrc: ["'self'", 'data:', 'https:', 'https://i.ytimg.com'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
          }
        }
      : false,
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// CORS configuration
const clientOrigins = allowedClientOrigins();
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/non-browser requests (no Origin header) and any
    // explicitly configured client origin(s).
    if (!origin || clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
  maxAge: 86400 // 24 hours
}));

app.use(compression());
app.use(cookieParser(env.COOKIE_SECRET));

// Request logging with security context
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || cryptoRandomId(),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
      if (res.statusCode >= 500 || err) return 'error';
      return 'info';
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }),
      res: (res) => ({
        statusCode: res.statusCode
      })
    }
  })
);

// Security middleware
app.use(ipFilter()); // IP blacklist/whitelist
app.use(detectSuspiciousPatterns()); // Pattern-based attack detection
app.use(sanitizeResponse()); // Remove sensitive fields from responses

// General rate limiting
app.use(generalLimiter);

// Input sanitization
app.use(mongoSanitize());
app.use(hpp());

// Body parser with request size limit
app.use(
  express.json({
    limit: '12mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl.includes('/api/payments/webhook')) {
        req.rawBody = Buffer.from(buf);
      }
    }
  })
);

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbHealth()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile', profileRoutes); // User profile routes
if (!isProduction) {
  app.use('/api/dev', devRoutes); // Developer debugging routes
}

const uploadsDir = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir, { fallthrough: false, maxAge: '7d' }));

const publicDir = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  // Setup process error handlers
  setupProcessErrorHandlers();

  await connectDb();
  await reconcileSiteContentIndexes();
  scheduleWeeklyBackup();
  await seedAdmins();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'NeuroCogno API listening');
    logger.info('🔒 Security: Maximum');
    logger.info('📊 Error Tracking: Active');
    logger.info('🛡️ Rate Limiting: Enabled');
    logger.info('📝 Audit Logging: Active');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

/**
 * One-time-per-restart index reconciliation for SiteContent.
 *
 * Why this exists: `key` used to carry a `unique: true` index (`key_1`) before
 * `slotKey` was introduced as the real per-slot identity. Mongoose never drops
 * an index just because the schema definition changed (`autoIndex` only adds
 * missing indexes, and is disabled entirely in production), so that stale
 * unique index kept living in MongoDB and caused
 * `E11000 duplicate key error ... key_1 dup key: { key: "homepage.hero.image" }`
 * on every save that correctly matched by `slotKey` but collided with an old
 * leftover document still holding the same descriptive `key` text.
 *
 * `syncIndexes()` reconciles MongoDB's actual indexes with what the current
 * Mongoose schema declares: it drops indexes no longer defined in the schema
 * (this removes the stale `key_1` unique index) and creates any missing ones
 * (this guarantees the `slotKey` unique index and the compound
 * {section,type,placement,order} unique index exist even in production, where
 * `autoIndex` is intentionally left off for performance). Scoped to just this
 * one small, low-write-volume collection so it's safe to run on every boot;
 * never blocks startup if it fails.
 */
async function reconcileSiteContentIndexes() {
  try {
    const result = await SiteContent.syncIndexes();
    logger.info({ result }, 'SiteContent indexes reconciled');
  } catch (error) {
    logger.error({ err: error }, 'Failed to reconcile SiteContent indexes (non-fatal, continuing startup)');
  }
}
