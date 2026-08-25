// auth-service entry point
// Responsibility: bootstrap the HTTP server and wire middleware/routes.
// Keep this file short — business logic goes in routes/controllers/services.

require('dotenv').config();
const app = require('./app');
const logger = require('./logger');
const { runMigrations } = require('./db/migrate');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Run migrations on boot so a fresh container is always up-to-date.
    // In production you'd run migrations as a separate step in CI/CD,
    // but for teaching this keeps the developer loop simple.
    if (process.env.RUN_MIGRATIONS_ON_BOOT !== 'false') {
      await runMigrations();
    }

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, 'auth-service listening');
    });

    // Graceful shutdown — important for zero-downtime deploys behind an ALB.
    const shutdown = (signal) => {
      logger.info({ signal }, 'shutting down');
      server.close(() => process.exit(0));
      // Force-exit if the server doesn't close within 10s
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'failed to start');
    process.exit(1);
  }
}

start();
