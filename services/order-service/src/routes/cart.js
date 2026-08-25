const router = require('express').Router();
const Joi = require('joi');
const pool = require('../db/pool');
const authRequired = require('../middleware/authRequired');
const productClient = require('../clients/productClient');

const addSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).max(50).required(),
});

router.use(authRequired);

// GET /cart — returns items with current price + name (joined from product-service)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT product_id, quantity FROM cart_items WHERE user_id = $1',
      [req.user.id]
    );
    const items = await Promise.all(rows.map(async (r) => {
      try {
        const p = await productClient.getProduct(r.product_id);
        return { product_id: r.product_id, quantity: r.quantity, name: p.name, price_cents: p.price_cents, image_url: p.image_url, in_stock: p.in_stock };
      } catch {
        return { product_id: r.product_id, quantity: r.quantity, unavailable: true };
      }
    }));
    const total_cents = items.reduce((sum, it) => sum + (it.unavailable ? 0 : it.price_cents * it.quantity), 0);
    res.json({ items, total_cents });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = addSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'validation', message: error.message });
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, added_at = NOW()`,
      [req.user.id, value.product_id, value.quantity]
    );
    res.status(201).json({ status: 'added' });
  } catch (err) { next(err); }
});

router.delete('/:product_id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.product_id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
