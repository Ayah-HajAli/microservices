const { Pool } = require('pg');

// One pool per process. The pool manages connection reuse.
// max=10 is fine for a service running ~10-50 RPS. Bump it for higher load.
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'ecommerce',
  password: process.env.DB_PASSWORD || 'devpassword',
  database: process.env.DB_NAME || 'ecommerce',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // Surface unexpected pool-level errors (e.g. RDS failover)
  // so they're visible in logs instead of crashing the process silently.
  console.error('pg pool error', err);
});

module.exports = pool;
