const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, slug FROM categories ORDER BY name');
    res.json({ items: rows });
  } catch (err) { next(err); }
});

module.exports = router;
