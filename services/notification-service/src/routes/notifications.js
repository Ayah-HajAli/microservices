const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Tiny JWT verify for user-facing list endpoint.
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'missing_token' });
  try { const p = jwt.verify(t, process.env.JWT_SECRET || 'dev-secret'); req.user = { id: p.sub, role: p.role }; next(); }
  catch { return res.status(401).json({ error: 'invalid_token' }); }
}

router.get('/', auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, subject, body, event_type, status, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

module.exports = router;
