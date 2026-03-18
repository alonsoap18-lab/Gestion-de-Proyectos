// routes/projects.js
const express = require('express');
const { v4: uuid } = require('uuid');
const { db, recalcProjectProgress } = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* helpers */
function enrichProject(p) {
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.specialty, u.phone, pm.project_role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY u.name
  `).all(p.id);

  const taskStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='Completed'  THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status='In Progress'THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN status='Started'    THEN 1 ELSE 0 END) AS started,
      SUM(CASE WHEN status='Pending'    THEN 1 ELSE 0 END) AS pending
    FROM tasks WHERE project_id = ?
  `).get(p.id);

  return { ...p, members, taskStats };
}

/* ── GET /api/projects ──────────────────────────────────── */
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const projects = db.prepare(sql).all(...params).map(enrichProject);
  res.json(projects);
});

/* ── GET /api/projects/:id ──────────────────────────────── */
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const tasks = db.prepare(`
    SELECT t.*, u.name AS assigned_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id = ?
    ORDER BY t.start_week, t.name
  `).all(req.params.id);

  const materials = db.prepare(
    'SELECT * FROM materials WHERE project_id = ? ORDER BY name'
  ).all(req.params.id);

  const machinery = db.prepare(`
    SELECT * FROM machinery WHERE project_id = ? ORDER BY name
  `).all(req.params.id);

  const photos = db.prepare(`
    SELECT ph.*, u.name AS uploader_name
    FROM photos ph
    LEFT JOIN users u ON u.id = ph.uploaded_by
    WHERE ph.project_id = ?
    ORDER BY ph.created_at DESC
    LIMIT 20
  `).all(req.params.id);

  res.json({ ...enrichProject(project), tasks, materials, machinery, photos });
});

/* ── POST /api/projects ─────────────────────────────────── */
router.post('/', (req, res) => {
  const { name, client, location, start_date, duration_weeks, status, description, budget } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre del proyecto es requerido.' });

  const id = uuid();
  db.prepare(`
    INSERT INTO projects (id,name,client,location,start_date,duration_weeks,status,description,budget)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    name.trim(),
    client || null,
    location || null,
    start_date || null,
    parseInt(duration_weeks) || 12,
    status || 'Planning',
    description || null,
    parseFloat(budget) || 0
  );
  res.status(201).json({ id });
});

/* ── PUT /api/projects/:id ──────────────────────────────── */
router.put('/:id', (req, res) => {
  const p = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const { name, client, location, start_date, duration_weeks, status, progress, description, budget, spent } = req.body;
  db.prepare(`
    UPDATE projects
    SET name=?,client=?,location=?,start_date=?,duration_weeks=?,status=?,progress=?,description=?,budget=?,spent=?
    WHERE id=?
  `).run(
    name, client, location, start_date,
    parseInt(duration_weeks) || 12,
    status,
    parseInt(progress) || 0,
    description,
    parseFloat(budget) || 0,
    parseFloat(spent) || 0,
    req.params.id
  );
  res.json({ success: true });
});

/* ── DELETE /api/projects/:id ───────────────────────────── */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

/* ── POST /api/projects/:id/members ────────────────────── */
router.post('/:id/members', (req, res) => {
  const { user_id, project_role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id es requerido.' });

  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
  if (!userExists) return res.status(404).json({ error: 'Usuario no encontrado.' });

  try {
    db.prepare(`
      INSERT INTO project_members (id,project_id,user_id,project_role)
      VALUES (?,?,?,?)
    `).run(uuid(), req.params.id, user_id, project_role || 'Member');
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(409).json({ error: 'El usuario ya es miembro de este proyecto.' });
  }
});

/* ── DELETE /api/projects/:id/members/:userId ───────────── */
router.delete('/:id/members/:userId', (req, res) => {
  db.prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?')
    .run(req.params.id, req.params.userId);
  res.json({ success: true });
});

/* ── POST /api/projects/:id/recalculate ─────────────────── */
router.post('/:id/recalculate', (req, res) => {
  const progress = recalcProjectProgress(req.params.id);
  res.json({ progress });
});

/* ── GET /api/projects/:id/gantt ────────────────────────── */
router.get('/:id/gantt', (req, res) => {
  const project = db.prepare('SELECT id,name,start_date,duration_weeks FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const tasks = db.prepare(`
    SELECT t.id, t.name, t.start_week, t.end_week, t.status, t.progress, t.priority,
           t.assigned_to, u.name AS assigned_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id = ?
    ORDER BY t.start_week, t.name
  `).all(req.params.id);

  res.json({ project, tasks });
});

module.exports = router;
