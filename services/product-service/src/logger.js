const pino = require('pino');
module.exports = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'product-service' },
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
