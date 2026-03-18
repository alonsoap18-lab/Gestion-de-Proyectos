// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const { db }  = require('../database/setup');
const { authenticate, signToken } = require('../middleware/auth');

const router = express.Router();

/* ── POST /api/auth/login ───────────────────────────────── */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Credenciales incorrectas.' });

  const { password: _pw, ...safeUser } = user;
  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  res.json({ token, user: safeUser });
});

/* ── GET /api/auth/me ───────────────────────────────────── */
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id,name,email,role,position,specialty,phone,created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json(user);
});

/* ── PUT /api/auth/me ───────────────────────────────────── */
router.put('/me', authenticate, (req, res) => {
  const { name, phone, specialty, position } = req.body;
  db.prepare(
    'UPDATE users SET name=?,phone=?,specialty=?,position=? WHERE id=?'
  ).run(name, phone, specialty, position, req.user.id);
  res.json({ success: true });
});

/* ── PUT /api/auth/password ─────────────────────────────── */
router.put('/password', authenticate, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Campos requeridos.' });

  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password))
    return res.status(400).json({ error: 'Contraseña actual incorrecta.' });

  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
  res.json({ success: true });
});

module.exports = router;
