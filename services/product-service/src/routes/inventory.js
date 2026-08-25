const router = require('express').Router();
const Joi = require('joi');
const pool = require('../db/pool');

// Internal endpoints called by order-service.
// In a real system you'd protect these with mTLS or a shared API key
// since they should never be reachable from the public ALB.

// POST /inventory/reserve { items: [{ product_id, quantity }] }
// Atomically reserves stock; fails the whole batch if any item is short.
router.post('/reserve', async (req, res, next) => {
  const schema = Joi.object({
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
    })).min(1).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: 'validation', message: error.message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of value.items) {
      const { rows } = await client.query(
        `UPDATE inventory
         SET reserved = reserved + $2, updated_at = NOW()
         WHERE product_id = $1 AND (quantity - reserved) >= $2
         RETURNING product_id, quantity, reserved`,
        [item.product_id, item.quantity]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'insufficient_stock', product_id: item.product_id });
      }
    }
    await client.query('COMMIT');
    res.json({ status: 'reserved' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// POST /inventory/commit — turn reserved into committed (actually decrement quantity)
router.post('/commit', async (req, res, next) => {
  const items = (req.body && req.body.items) || [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const it of items) {
      await client.query(
        `UPDATE inventory
         SET quantity = quantity - $2,
             reserved = GREATEST(reserved - $2, 0),
             updated_at = NOW()
         WHERE product_id = $1`,
        [it.product_id, it.quantity]
      );
    }
    await client.query('COMMIT');
    res.json({ status: 'committed' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// POST /inventory/release — undo a reservation (order cancelled)
router.post('/release', async (req, res, next) => {
  const items = (req.body && req.body.items) || [];
  try {
    for (const it of items) {
      await pool.query(
        'UPDATE inventory SET reserved = GREATEST(reserved - $2, 0), updated_at = NOW() WHERE product_id = $1',
        [it.product_id, it.quantity]
      );
    }
    res.json({ status: 'released' });
  } catch (err) { next(err); }
});

module.exports = router;
