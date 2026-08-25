const router = require('express').Router();
const Joi = require('joi');
const pool = require('../db/pool');
const authRequired = require('../middleware/authRequired');
const productClient = require('../clients/productClient');
const eventBus = require('../clients/eventBus');

router.use(authRequired);

const checkoutSchema = Joi.object({
  shipping_address: Joi.object({
    line1: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().required(),
    country: Joi.string().length(2).required(),
  }).required(),
});

// POST /orders/checkout — turn cart into an order.
// 1. Read cart items
// 2. Fetch current prices from product-service
// 3. Reserve inventory (rolls back the whole order if any item is short)
// 4. Insert order + items in a DB transaction
// 5. Commit inventory
// 6. Publish "order.created" event
// 7. Clear cart
router.post('/checkout', async (req, res, next) => {
  const { error, value } = checkoutSchema.validate(req.body);
  if (error) return res.status(400).json({ error: 'validation', message: error.message });

  const userId = req.user.id;
  const { rows: cartRows } = await pool.query('SELECT product_id, quantity FROM cart_items WHERE user_id = $1', [userId]);
  if (cartRows.length === 0) return res.status(400).json({ error: 'empty_cart' });

  // Fetch fresh prices
  const items = [];
  for (const row of cartRows) {
    try {
      const p = await productClient.getProduct(row.product_id);
      items.push({
        product_id: p.id, product_sku: p.sku, product_name: p.name,
        unit_price_cents: p.price_cents, quantity: row.quantity,
        line_total_cents: p.price_cents * row.quantity,
      });
    } catch (e) {
      return res.status(409).json({ error: 'product_unavailable', product_id: row.product_id });
    }
  }
  const total = items.reduce((s, it) => s + it.line_total_cents, 0);

  // Reserve inventory
  try {
    await productClient.reserve(items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })));
  } catch (e) {
    return res.status(409).json({ error: 'insufficient_stock', detail: e.response?.data });
  }

  // Persist order
  const client = await pool.connect();
  let orderId;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO orders (user_id, status, total_cents, shipping_address) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, 'confirmed', total, value.shipping_address]
    );
    orderId = rows[0].id;
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_sku, product_name, unit_price_cents, quantity, line_total_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, it.product_id, it.product_sku, it.product_name, it.unit_price_cents, it.quantity, it.line_total_cents]
      );
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    // Best-effort release of reserved stock
    productClient.release(items.map((it) => ({ product_id: it.product_id, quantity: it.quantity }))).catch(() => {});
    return next(err);
  } finally {
    client.release();
  }

  // Commit inventory + publish event (best-effort — failure here doesn't roll back the order)
  productClient.commit(items.map((it) => ({ product_id: it.product_id, quantity: it.quantity }))).catch(() => {});
  eventBus.publish({
    id: orderId,
    type: 'order.created',
    occurred_at: new Date().toISOString(),
    user: { id: userId, email: req.user.email },
    order: { id: orderId, total_cents: total, items },
  });

  res.status(201).json({ id: orderId, status: 'confirmed', total_cents: total, items });
});

// GET /orders — my orders
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.total_cents, o.created_at,
              COALESCE(json_agg(json_build_object('product_name', i.product_name, 'quantity', i.quantity, 'line_total_cents', i.line_total_cents)) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items i ON i.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// GET /orders/:id — order detail
router.get('/:id', async (req, res, next) => {
  try {
    const { rows: orderRows } = await pool.query(
      'SELECT id, user_id, status, total_cents, shipping_address, created_at FROM orders WHERE id = $1',
      [req.params.id]
    );
    if (orderRows.length === 0) return res.status(404).json({ error: 'not_found' });
    if (orderRows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...orderRows[0], items });
  } catch (err) { next(err); }
});

module.exports = router;
