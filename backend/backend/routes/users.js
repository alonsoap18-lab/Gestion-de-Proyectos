// routes/users.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { db }  = require('../database/setup');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const SAFE_FIELDS = 'id,name,email,role,position,specialty,phone,active,created_at';

/* ── GET /api/users ─────────────────────────────────────── */
router.get('/', (req, res) => {
  const { role, search } = req.query;
  let sql = `SELECT ${SAFE_FIELDS} FROM users WHERE 1=1`;
  const params = [];

  if (role)   { sql += ' AND role = ?';                      params.push(role); }
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY name ASC';
  res.json(db.prepare(sql).all(...params));
});

/* ── GET /api/users/:id ─────────────────────────────────── */
router.get('/:id', (req, res) => {
  const user = db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

  // Projects assigned to
  const projects = db.prepare(`
    SELECT p.id, p.name, p.status, p.progress, pm.project_role
    FROM project_members pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.user_id = ?
    ORDER BY p.name
  `).all(req.params.id);

  // Task stats
  const taskStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) AS pending
    FROM tasks WHERE assigned_to = ?
  `).get(req.params.id);

  res.json({ ...user, projects, taskStats });
});

/* ── POST /api/users ────────────────────────────────────── */
router.post('/', requireRole('Admin'), (req, res) => {
  const { name, email, password, role, phone, specialty, position } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (exists) return res.status(409).json({ error: 'El correo ya está registrado.' });

  const id   = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (id,name,email,password,role,phone,specialty,position)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(id, name.trim(), email.toLowerCase().trim(), hash, role || 'Worker', phone || null, specialty || null, position || null);

  res.status(201).json({ id, name, email, role: role || 'Worker' });
});

/* ── PUT /api/users/:id ─────────────────────────────────── */
router.put('/:id', requireRole('Admin'), (req, res) => {
  const { name, email, role, phone, specialty, position, active, password } = req.body;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

  // Check email conflict with other users
  if (email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), req.params.id);
    if (conflict) return res.status(409).json({ error: 'El correo ya está registrado por otro usuario.' });
  }

  if (password && password.length >= 6) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      UPDATE users SET name=?,email=?,role=?,phone=?,specialty=?,position=?,active=?,password=? WHERE id=?
    `).run(name, email?.toLowerCase().trim(), role, phone, specialty, position, active !== undefined ? (active ? 1 : 0) : 1, hash, req.params.id);
  } else {
    db.prepare(`
      UPDATE users SET name=?,email=?,role=?,phone=?,specialty=?,position=?,active=? WHERE id=?
    `).run(name, email?.toLowerCase().trim(), role, phone, specialty, position, active !== undefined ? (active ? 1 : 0) : 1, req.params.id);
  }

  res.json({ success: true });
});

/* ── DELETE /api/users/:id ──────────────────────────────── */
router.delete('/:id', requireRole('Admin'), (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
