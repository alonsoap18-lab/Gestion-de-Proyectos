// routes/projects.js
const express = require('express');
const { v4: uuid } = require('uuid');
const supabase = require('../supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── GET PROYECTOS ───────────────────────── */
router.get('/', async (req, res) => {
  const { status } = req.query;

  let query = supabase.from('projects').select('*');

  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return res.status(500).json(error);

  res.json(data);
});

/* ── GET PROYECTO POR ID ─────────────────── */
router.get('/:id', async (req, res) => {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', req.params.id);

  res.json({ ...project, tasks });
});

/* ── CREAR PROYECTO ─────────────────────── */
router.post('/', async (req, res) => {
  const { name, client, location, start_date, duration_weeks, status, description, budget } = req.body;

  if (!name) return res.status(400).json({ error: 'Nombre requerido' });

  const { data, error } = await supabase
    .from('projects')
    .insert([{
      id: uuid(),
      name,
      client,
      location,
      start_date,
      duration_weeks,
      status,
      description,
      budget
    }])
    .select();

  if (error) return res.status(500).json(error);

  res.status(201).json(data[0]);
});

/* ── ACTUALIZAR ─────────────────────────── */
router.put('/:id', async (req, res) => {
  const { error } = await supabase
    .from('projects')
    .update(req.body)
    .eq('id', req.params.id);

  if (error) return res.status(500).json(error);

  res.json({ success: true });
});

/* ── ELIMINAR ───────────────────────────── */
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json(error);

  res.json({ success: true });
});

module.exports = router;
module.exports = router;
