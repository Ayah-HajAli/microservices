const jwt = require('jsonwebtoken');

// Admin-only writes — verifies JWT locally using shared secret.
// In production, prefer calling auth-service /auth/verify so this service
// doesn't need the JWT_SECRET. We use local verify here to keep the demo fast.
module.exports = function adminOnly(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (p.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.user = { id: p.sub, role: p.role };
    next();
  } catch { return res.status(401).json({ error: 'invalid_token' }); }
};
