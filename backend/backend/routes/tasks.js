// routes/tasks.js
const express = require('express');
const { v4: uuid } = require('uuid');
const { db, recalcProjectProgress } = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── GET /api/tasks ─────────────────────────────────────── */
router.get('/', (req, res) => {
  const { project_id, assigned_to, status, priority } = req.query;

  let sql = `
    SELECT t.*,
           u.name  AS assigned_name,
           p.name  AS project_name,
           p.start_date AS project_start_date
    FROM tasks t
    LEFT JOIN users    u ON u.id = t.assigned_to
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE 1=1
  `;
  const params = [];

  if (project_id)  { sql += ' AND t.project_id = ?';  params.push(project_id); }
  if (assigned_to) { sql += ' AND t.assigned_to = ?'; params.push(assigned_to); }
  if (status)      { sql += ' AND t.status = ?';      params.push(status); }
  if (priority)    { sql += ' AND t.priority = ?';    params.push(priority); }

  sql += ' ORDER BY t.start_week, t.name';
  res.json(db.prepare(sql).all(...params));
});

/* ── GET /api/tasks/:id ─────────────────────────────────── */
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*,
           u.name       AS assigned_name,
           p.name       AS project_name,
           p.start_date AS project_start_date
    FROM tasks t
    LEFT JOIN users    u ON u.id = t.assigned_to
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Tarea no encontrada.' });

  const photos = db.prepare(`
    SELECT ph.*, u.name AS uploader_name
    FROM photos ph
    LEFT JOIN users u ON u.id = ph.uploaded_by
    WHERE ph.task_id = ?
    ORDER BY ph.created_at DESC
  `).all(req.params.id);

  res.json({ ...task, photos });
});

/* ── POST /api/tasks ────────────────────────────────────── */
router.post('/', (req, res) => {
  const { name, project_id, assigned_to, start_week, end_week, status, progress, priority, description } = req.body;
  if (!name?.trim())  return res.status(400).json({ error: 'El nombre de la tarea es requerido.' });
  if (!project_id)    return res.status(400).json({ error: 'El proyecto es requerido.' });

  const projExists = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
  if (!projExists) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const id = uuid();
  const sw = parseInt(start_week) || 1;
  const ew = parseInt(end_week)   || sw + 1;

  db.prepare(`
    INSERT INTO tasks (id,name,project_id,assigned_to,start_week,end_week,status,progress,priority,description)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, name.trim(), project_id,
    assigned_to || null,
    sw, ew,
    status   || 'Pending',
    parseInt(progress)  || 0,
    priority || 'Medium',
    description || null
  );

  recalcProjectProgress(project_id);
  res.status(201).json({ id });
});

/* ── PUT /api/tasks/:id ─────────────────────────────────── */
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada.' });

  const { name, assigned_to, start_week, end_week, status, progress, priority, description } = req.body;

  db.prepare(`
    UPDATE tasks
    SET name=?,assigned_to=?,start_week=?,end_week=?,status=?,progress=?,priority=?,description=?
    WHERE id=?
  `).run(
    name,
    assigned_to || null,
    parseInt(start_week) || 1,
    parseInt(end_week)   || 2,
    status,
    parseInt(progress) || 0,
    priority,
    description,
    req.params.id
  );

  recalcProjectProgress(existing.project_id);
  res.json({ success: true });
});

/* ── PATCH /api/tasks/:id/position  (Gantt drag-drop) ───── */
router.patch('/:id/position', (req, res) => {
  const existing = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada.' });

  const { start_week, end_week } = req.body;
  if (start_week === undefined || end_week === undefined)
    return res.status(400).json({ error: 'start_week y end_week son requeridos.' });

  db.prepare('UPDATE tasks SET start_week=?,end_week=? WHERE id=?')
    .run(parseInt(start_week), parseInt(end_week), req.params.id);

  res.json({ success: true });
});

/* ── DELETE /api/tasks/:id ──────────────────────────────── */
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada.' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  recalcProjectProgress(existing.project_id);
  res.json({ success: true });
});

module.exports = router;
