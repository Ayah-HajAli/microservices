const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'ecommerce',
  password: process.env.DB_PASSWORD || 'devpassword',
  database: process.env.DB_NAME || 'ecommerce',
  max: parseInt(process.env.DB_POOL_MAX || '5', 10),
});
pool.on('error', (err) => console.error('pg pool error', err));
module.exports = pool;
