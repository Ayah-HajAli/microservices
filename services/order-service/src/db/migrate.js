const pool = require('./pool');
const logger = require('../logger');

const migrations = [
  {
    name: '001_create_orders',
    sql: `
      CREATE TABLE IF NOT EXISTS orders (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL,
        status        VARCHAR(32) NOT NULL DEFAULT 'pending',
        total_cents   INTEGER NOT NULL DEFAULT 0,
        shipping_address JSONB,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
  },
  {
    name: '002_create_order_items',
    sql: `
      CREATE TABLE IF NOT EXISTS order_items (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id    UUID NOT NULL,
        product_sku   VARCHAR(64) NOT NULL,
        product_name  VARCHAR(255) NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        quantity      INTEGER NOT NULL CHECK (quantity > 0),
        line_total_cents INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);`,
  },
  {
    name: '003_create_cart',
    sql: `
      CREATE TABLE IF NOT EXISTS cart_items (
        user_id     UUID NOT NULL,
        product_id  UUID NOT NULL,
        quantity    INTEGER NOT NULL CHECK (quantity > 0),
        added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, product_id)
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  for (const m of migrations) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [m.name]);
    if (rows.length === 0) {
      logger.info({ migration: m.name }, 'applying');
      await pool.query(m.sql);
      await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [m.name]);
    }
  }
  logger.info('migrations complete');
}

if (require.main === module) runMigrations().then(() => process.exit(0)).catch((err) => { logger.error({ err }); process.exit(1); });
module.exports = { runMigrations };
