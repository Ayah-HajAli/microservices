const pool = require('./pool');
const logger = require('../logger');

const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email           VARCHAR(255) UNIQUE NOT NULL,
        password_hash   VARCHAR(255) NOT NULL,
        full_name       VARCHAR(255),
        role            VARCHAR(32) NOT NULL DEFAULT 'customer',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `,
  },
];

async function ensureExtension(name) {
  // CREATE EXTENSION IF NOT EXISTS is NOT concurrency-safe in postgres.
  // Multiple services racing on startup can both lose; swallow the duplicate-key error.
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS ${name}`);
  } catch (e) {
    if (e.code !== '23505') throw e;
  }
}

async function runMigrations() {
  await ensureExtension('pgcrypto');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  for (const m of migrations) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [m.name]);
    if (rows.length === 0) {
      logger.info({ migration: m.name }, 'applying migration');
      await pool.query(m.sql);
      await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [m.name]);
    }
  }
  logger.info('migrations complete');
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch((err) => { logger.error({ err }, 'failed'); process.exit(1); });
}
module.exports = { runMigrations };
