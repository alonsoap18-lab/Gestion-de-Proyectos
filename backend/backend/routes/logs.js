// routes/logs.js
const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { project_id } = req.query;
  let sql = `
    SELECT l.*, u.name AS author_name, p.name AS project_name
    FROM daily_logs l
    LEFT JOIN users    u ON u.id = l.user_id
    LEFT JOIN projects p ON p.id = l.project_id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) { sql += ' AND l.project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY l.log_date DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { project_id, log_date, weather, workers, notes } = req.body;
  if (!project_id || !log_date) return res.status(400).json({ error: 'project_id y log_date son requeridos.' });
  const id = uuid();
  db.prepare(`
    INSERT INTO daily_logs (id,project_id,user_id,log_date,weather,workers,notes)
    VALUES (?,?,?,?,?,?,?)
  `).run(id, project_id, req.user.id, log_date, weather || null, parseInt(workers) || 0, notes || null);
  res.status(201).json({ id });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM daily_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
