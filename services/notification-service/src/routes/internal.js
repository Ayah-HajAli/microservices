const router = require('express').Router();
const handlers = require('../handlers');

// Internal HTTP fallback for local dev. In AWS this endpoint should be
// blocked by the security group — only SQS should deliver events.
router.post('/events', async (req, res, next) => {
  try {
    await handlers.handle(req.body);
    res.status(202).json({ status: 'accepted' });
  } catch (err) { next(err); }
});

module.exports = router;
