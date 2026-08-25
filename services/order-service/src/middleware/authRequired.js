const jwt = require('jsonwebtoken');
module.exports = function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = { id: p.sub, email: p.email, role: p.role };
    next();
  } catch { return res.status(401).json({ error: 'invalid_token' }); }
};
