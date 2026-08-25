const pool = require('./pool');
const logger = require('../logger');

const migrations = [
  {
    name: '001_create_categories',
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(120) UNIQUE NOT NULL,
        slug        VARCHAR(120) UNIQUE NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
  },
  {
    name: '002_create_products',
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku           VARCHAR(64) UNIQUE NOT NULL,
        name          VARCHAR(255) NOT NULL,
        description   TEXT,
        price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
        category_id   UUID REFERENCES categories(id),
        image_url     TEXT,
        active        BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
      CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);`,
  },
  {
    name: '003_create_inventory',
    sql: `
      CREATE TABLE IF NOT EXISTS inventory (
        product_id  UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
        quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        reserved    INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
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
  await ensureExtension('pg_trgm');
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
