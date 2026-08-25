const router = require('express').Router();
const pool = require('../db/pool');

// Two endpoints, deliberately:
//
//   /health/live   — am I running? (used by ALB target group + ECS/K8s liveness)
//                    NEVER touches the DB. If DB is down we still want the process up.
//
//   /health/ready  — am I ready to serve traffic? (touches DB).
//                    If false, the load balancer pulls us out of rotation.

router.get('/live', (_req, res) => res.json({ status: 'ok' }));

router.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', reason: 'db_unreachable' });
  }
});

module.exports = router;
