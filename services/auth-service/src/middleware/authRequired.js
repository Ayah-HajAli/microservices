const jwt = require('jsonwebtoken');

// Verifies the Authorization: Bearer <jwt> header.
// Attaches req.user = { id, email, role } on success.
module.exports = function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};
