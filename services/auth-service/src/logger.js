const pino = require('pino');

// JSON logs in production, pretty logs in dev.
// CloudWatch Logs Insights queries work great against pino's JSON.
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'auth-service' },
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
});

module.exports = logger;
