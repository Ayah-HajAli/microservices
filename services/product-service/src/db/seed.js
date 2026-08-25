const pool = require('./pool');
const logger = require('../logger');

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Clothing',    slug: 'clothing' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Books',       slug: 'books' },
];

const PRODUCTS = [
  { sku: 'EL-001', name: 'Wireless Headphones',    description: 'Noise-cancelling over-ear', price_cents: 12999, category: 'electronics', qty: 50,  image: 'https://placehold.co/300x300?text=Headphones' },
  { sku: 'EL-002', name: 'Smart Watch',            description: 'Fitness tracking',          price_cents: 19999, category: 'electronics', qty: 30,  image: 'https://placehold.co/300x300?text=Watch' },
  { sku: 'EL-003', name: 'Bluetooth Speaker',      description: 'Portable, waterproof',      price_cents:  6499, category: 'electronics', qty: 80,  image: 'https://placehold.co/300x300?text=Speaker' },
  { sku: 'CL-001', name: 'Cotton T-Shirt',         description: 'Premium fabric, unisex',    price_cents:  2499, category: 'clothing',    qty: 200, image: 'https://placehold.co/300x300?text=Tshirt' },
  { sku: 'CL-002', name: 'Denim Jeans',            description: 'Slim fit',                  price_cents:  5999, category: 'clothing',    qty: 100, image: 'https://placehold.co/300x300?text=Jeans' },
  { sku: 'HK-001', name: 'Coffee Maker',           description: '12-cup programmable',       price_cents:  8999, category: 'home-kitchen',qty: 40,  image: 'https://placehold.co/300x300?text=Coffee' },
  { sku: 'HK-002', name: 'Cast-iron Skillet',      description: '10-inch pre-seasoned',      price_cents:  3499, category: 'home-kitchen',qty: 60,  image: 'https://placehold.co/300x300?text=Skillet' },
  { sku: 'BK-001', name: 'The Pragmatic Programmer', description: '20th anniversary edition',price_cents:  3299, category: 'books',       qty: 75,  image: 'https://placehold.co/300x300?text=Book' },
  { sku: 'BK-002', name: 'Clean Code',             description: 'A handbook of software craftsmanship', price_cents: 2899, category: 'books', qty: 60, image: 'https://placehold.co/300x300?text=Book2' },
];

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products');
  if (rows[0].n > 0) {
    logger.info({ existing: rows[0].n }, 'products exist, skipping seed');
    return;
  }
  logger.info('seeding catalog');
  const catMap = {};
  for (const c of CATEGORIES) {
    const { rows: r } = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id, slug', [c.name, c.slug]);
    catMap[r[0].slug] = r[0].id;
  }
  for (const p of PRODUCTS) {
    const { rows: r } = await pool.query(
      `INSERT INTO products (sku, name, description, price_cents, category_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (sku) DO NOTHING
       RETURNING id`,
      [p.sku, p.name, p.description, p.price_cents, catMap[p.category], p.image]
    );
    if (r[0]) await pool.query('INSERT INTO inventory (product_id, quantity) VALUES ($1, $2) ON CONFLICT (product_id) DO UPDATE SET quantity = EXCLUDED.quantity', [r[0].id, p.qty]);
  }
  logger.info({ count: PRODUCTS.length }, 'seed complete');
}

if (require.main === module) {
  seedIfEmpty().then(() => process.exit(0)).catch((err) => { logger.error({ err }, 'seed failed'); process.exit(1); });
}
module.exports = { seedIfEmpty };
