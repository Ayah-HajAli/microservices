require('dotenv').config();
const app = require('./app');
const logger = require('./logger');
const { runMigrations } = require('./db/migrate');
const { startSqsConsumer } = require('./consumer/sqsConsumer');

const PORT = process.env.PORT || 3004;

async function start() {
  try {
    if (process.env.RUN_MIGRATIONS_ON_BOOT !== 'false') await runMigrations();

    const server = app.listen(PORT, () => logger.info({ port: PORT }, 'notification-service listening'));

    // Start SQS consumer only when SQS mode is configured.
    // In local dev we use the HTTP /internal/events endpoint instead.
    if (process.env.EVENT_BUS_MODE === 'sqs' && process.env.SQS_QUEUE_URL) {
      startSqsConsumer().catch((err) => logger.error({ err }, 'consumer crashed'));
    } else {
      logger.info('SQS consumer disabled — using HTTP /internal/events for local dev');
    }

    const shutdown = (sig) => { logger.info({ sig }, 'shutdown'); server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10_000).unref(); };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) { logger.error({ err }, 'failed to start'); process.exit(1); }
}
start();
