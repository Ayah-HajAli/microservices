const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../db/pool');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  fullName: Joi.string().min(1).max(255).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_TTL || '24h' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'validation', message: error.message });

    const hash = await bcrypt.hash(value.password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role, created_at`,
      [value.email.toLowerCase(), hash, value.fullName]
    );
    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {                   // unique violation on email
      return res.status(409).json({ error: 'email_taken' });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'validation', message: error.message });

    const { rows } = await pool.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [value.email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(value.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const safeUser = { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) { next(err); }
});

// Verify endpoint — other services can call this to validate a token without
// importing our JWT secret. Useful pattern when JWT_SECRET should only live in auth-service.
router.post('/verify', (req, res) => {
  const token = (req.body && req.body.token) || '';
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    res.json({ valid: true, user: { id: payload.sub, email: payload.email, role: payload.role } });
  } catch (_err) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
