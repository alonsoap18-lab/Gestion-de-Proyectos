// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET  || 'icaa_jwt_secret_2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

/* ── Verify JWT ─────────────────────────────────────────── */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

/* ── Role guard factory ─────────────────────────────────── */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes.' });
    }
    next();
  };
}

/* ── Sign helper ────────────────────────────────────────── */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

module.exports = { authenticate, requireRole, signToken };
