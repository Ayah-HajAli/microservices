const router = require('express').Router();
const pool = require('../db/pool');
router.get('/live', (_req, res) => res.json({ status: 'ok' }));
router.get('/ready', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }
  catch { res.status(503).json({ status: 'degraded', reason: 'db_unreachable' }); }
});
module.exports = router;
