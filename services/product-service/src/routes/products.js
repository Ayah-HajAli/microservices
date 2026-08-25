const router = require('express').Router();
const Joi = require('joi');
const pool = require('../db/pool');
const adminOnly = require('../middleware/adminOnly');

const productSchema = Joi.object({
  sku: Joi.string().max(64).required(),
  name: Joi.string().max(255).required(),
  description: Joi.string().allow('').max(5000),
  price_cents: Joi.number().integer().min(0).required(),
  category_id: Joi.string().uuid().allow(null),
  image_url: Joi.string().uri().allow('', null),
});

// GET /products?search=&category=&limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const params = [];
    const where = ['p.active = TRUE'];

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      where.push(`p.name ILIKE $${params.length}`);
    }
    if (req.query.category) {
      params.push(req.query.category);
      where.push(`c.slug = $${params.length}`);
    }
    params.push(limit); params.push(offset);
    const sql = `
      SELECT p.id, p.sku, p.name, p.description, p.price_cents, p.image_url,
             c.slug AS category, c.name AS category_name,
             COALESCE(i.quantity - i.reserved, 0) AS in_stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(sql, params);
    res.json({ items: rows, limit, offset });
  } catch (err) { next(err); }
});

// GET /products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.sku, p.name, p.description, p.price_cents, p.image_url,
              c.slug AS category, c.name AS category_name,
              COALESCE(i.quantity - i.reserved, 0) AS in_stock
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /products — admin only
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'validation', message: error.message });
    const { rows } = await pool.query(
      `INSERT INTO products (sku, name, description, price_cents, category_id, image_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [value.sku, value.name, value.description || '', value.price_cents, value.category_id || null, value.image_url || null]
    );
    await pool.query('INSERT INTO inventory (product_id, quantity) VALUES ($1, 0) ON CONFLICT DO NOTHING', [rows[0].id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'sku_taken' });
    next(err);
  }
});

// DELETE /products/:id — soft delete (set active=false)
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET active = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
