const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers — sets a sensible baseline (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet());

// CORS — locked down via env var. In dev we allow the local frontend.
// In prod the ALB + same-origin proxy means CORS isn't usually needed at all.
app.use(cors({ origin: (process.env.CORS_ORIGINS || '*').split(',') }));

// Body parsing
app.use(express.json({ limit: '100kb' }));

// Structured request logging — every request gets a request id, latency, status.
// CloudWatch can parse pino's JSON output natively. This is gold for debugging in prod.
app.use(pinoHttp({ logger }));

// Routes
app.use('/health', healthRoutes);     // unauthenticated — used by ALB target group
app.use('/auth', authRoutes);         // register/login/refresh
app.use('/users', userRoutes);        // profile (requires JWT)

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// Centralized error handler — must be the LAST middleware
app.use(errorHandler);

module.exports = app;
