require('dotenv').config();
const app = require('./app');
const logger = require('./logger');
const { runMigrations } = require('./db/migrate');

const PORT = process.env.PORT || 3003;
async function start() {
  try {
    if (process.env.RUN_MIGRATIONS_ON_BOOT !== 'false') await runMigrations();
    const server = app.listen(PORT, () => logger.info({ port: PORT }, 'order-service listening'));
    const shutdown = (sig) => { logger.info({ sig }, 'shutdown'); server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10_000).unref(); };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) { logger.error({ err }, 'failed to start'); process.exit(1); }
}
start();
