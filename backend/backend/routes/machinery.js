// routes/machinery.js
const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── GET /api/machinery ─────────────────────────────────── */
router.get('/', (req, res) => {
  const { status, project_id } = req.query;
  let sql = `
    SELECT m.*, p.name AS project_name
    FROM machinery m
    LEFT JOIN projects p ON p.id = m.project_id
    WHERE 1=1
  `;
  const params = [];
  if (status)     { sql += ' AND m.status = ?';     params.push(status); }
  if (project_id) { sql += ' AND m.project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY m.name ASC';
  res.json(db.prepare(sql).all(...params));
});

/* ── GET /api/machinery/:id ─────────────────────────────── */
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT m.*, p.name AS project_name FROM machinery m
    LEFT JOIN projects p ON p.id = m.project_id
    WHERE m.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Maquinaria no encontrada.' });
  res.json(row);
});

/* ── POST /api/machinery ────────────────────────────────── */
router.post('/', (req, res) => {
  const { name, type, brand, model, serial_number, status, project_id, notes } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre es requerido.' });

  const id = uuid();
  db.prepare(`
    INSERT INTO machinery (id,name,type,brand,model,serial_number,status,project_id,notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, name.trim(), type || null, brand || null, model || null,
    serial_number || null, status || 'Available', project_id || null, notes || null);

  res.status(201).json({ id });
});

/* ── PUT /api/machinery/:id ─────────────────────────────── */
router.put('/:id', (req, res) => {
  const exists = db.prepare('SELECT id FROM machinery WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Maquinaria no encontrada.' });

  const { name, type, brand, model, serial_number, status, project_id, notes } = req.body;
  db.prepare(`
    UPDATE machinery SET name=?,type=?,brand=?,model=?,serial_number=?,status=?,project_id=?,notes=?
    WHERE id=?
  `).run(name, type, brand, model, serial_number, status, project_id || null, notes, req.params.id);

  res.json({ success: true });
});

/* ── DELETE /api/machinery/:id ──────────────────────────── */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM machinery WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
