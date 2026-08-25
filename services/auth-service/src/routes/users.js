const router = require('express').Router();
const pool = require('../db/pool');
const authRequired = require('../middleware/authRequired');

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const fullName = req.body && req.body.fullName;
    if (!fullName) return res.status(400).json({ error: 'validation', message: 'fullName required' });
    const { rows } = await pool.query(
      `UPDATE users SET full_name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, role`,
      [fullName, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
