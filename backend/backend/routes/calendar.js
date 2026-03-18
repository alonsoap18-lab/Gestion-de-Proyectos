// routes/calendar.js
const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── GET /api/calendar ──────────────────────────────────── */
router.get('/', (req, res) => {
  const { project_id, user_id, type, from, to } = req.query;

  let sql = `
    SELECT e.*,
           p.name AS project_name,
           u.name AS user_name
    FROM calendar_events e
    LEFT JOIN projects p ON p.id = e.project_id
    LEFT JOIN users    u ON u.id = e.user_id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) { sql += ' AND e.project_id = ?'; params.push(project_id); }
  if (user_id)    { sql += ' AND e.user_id = ?';    params.push(user_id); }
  if (type)       { sql += ' AND e.type = ?';       params.push(type); }
  if (from)       { sql += ' AND e.start_date >= ?';params.push(from); }
  if (to)         { sql += ' AND e.start_date <= ?';params.push(to); }

  sql += ' ORDER BY e.start_date ASC';
  res.json(db.prepare(sql).all(...params));
});

/* ── POST /api/calendar ─────────────────────────────────── */
router.post('/', (req, res) => {
  const { title, description, start_date, end_date, type, project_id, user_id, color } = req.body;
  if (!title?.trim())  return res.status(400).json({ error: 'Título es requerido.' });
  if (!start_date)     return res.status(400).json({ error: 'Fecha de inicio es requerida.' });

  const id = uuid();
  db.prepare(`
    INSERT INTO calendar_events (id,title,description,start_date,end_date,type,project_id,user_id,color)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    id, title.trim(), description || null,
    start_date, end_date || null,
    type || 'Task',
    project_id || null,
    user_id    || null,
    color      || '#f97316'
  );
  res.status(201).json({ id });
});

/* ── PUT /api/calendar/:id ──────────────────────────────── */
router.put('/:id', (req, res) => {
  const ev = db.prepare('SELECT id FROM calendar_events WHERE id = ?').get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado.' });

  const { title, description, start_date, end_date, type, project_id, user_id, color } = req.body;
  db.prepare(`
    UPDATE calendar_events
    SET title=?,description=?,start_date=?,end_date=?,type=?,project_id=?,user_id=?,color=?
    WHERE id=?
  `).run(title, description, start_date, end_date, type, project_id || null, user_id || null, color, req.params.id);

  res.json({ success: true });
});

/* ── DELETE /api/calendar/:id ───────────────────────────── */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM calendar_events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
