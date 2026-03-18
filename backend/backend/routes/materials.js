// routes/materials.js
const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── GET /api/materials ─────────────────────────────────── */
router.get('/', (req, res) => {
  const { project_id } = req.query;
  let sql = `
    SELECT m.*, p.name AS project_name
    FROM materials m
    LEFT JOIN projects p ON p.id = m.project_id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) { sql += ' AND m.project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY m.name ASC';
  res.json(db.prepare(sql).all(...params));
});

/* ── GET /api/materials/:id ─────────────────────────────── */
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT m.*, p.name AS project_name FROM materials m
    LEFT JOIN projects p ON p.id = m.project_id WHERE m.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Material no encontrado.' });
  res.json(row);
});

/* ── POST /api/materials ────────────────────────────────── */
router.post('/', (req, res) => {
  const { name, unit, quantity, used_quantity, cost_per_unit, project_id, supplier, notes } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre es requerido.' });

  const id = uuid();
  db.prepare(`
    INSERT INTO materials (id,name,unit,quantity,used_quantity,cost_per_unit,project_id,supplier,notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    id, name.trim(),
    unit          || 'units',
    parseFloat(quantity)      || 0,
    parseFloat(used_quantity) || 0,
    parseFloat(cost_per_unit) || 0,
    project_id || null,
    supplier   || null,
    notes      || null
  );
  res.status(201).json({ id });
});

/* ── PUT /api/materials/:id ─────────────────────────────── */
router.put('/:id', (req, res) => {
  const exists = db.prepare('SELECT id FROM materials WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Material no encontrado.' });

  const { name, unit, quantity, used_quantity, cost_per_unit, project_id, supplier, notes } = req.body;
  db.prepare(`
    UPDATE materials
    SET name=?,unit=?,quantity=?,used_quantity=?,cost_per_unit=?,project_id=?,supplier=?,notes=?
    WHERE id=?
  `).run(
    name, unit,
    parseFloat(quantity)      || 0,
    parseFloat(used_quantity) || 0,
    parseFloat(cost_per_unit) || 0,
    project_id || null, supplier, notes,
    req.params.id
  );
  res.json({ success: true });
});

/* ── PATCH /api/materials/:id/usage ─────────────────────── */
router.patch('/:id/usage', (req, res) => {
  const { used_quantity } = req.body;
  db.prepare('UPDATE materials SET used_quantity=? WHERE id=?')
    .run(parseFloat(used_quantity) || 0, req.params.id);
  res.json({ success: true });
});

/* ── DELETE /api/materials/:id ──────────────────────────── */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
