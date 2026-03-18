// routes/photos.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuid } = require('uuid');
const { db }  = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── Multer storage ─────────────────────────────────────── */
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${uuid()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(file.mimetype));
  }
});

/* ── GET /api/photos ────────────────────────────────────── */
router.get('/', (req, res) => {
  const { project_id, task_id } = req.query;
  let sql = `
    SELECT ph.*, u.name AS uploader_name
    FROM photos ph
    LEFT JOIN users u ON u.id = ph.uploaded_by
    WHERE 1=1
  `;
  const params = [];
  if (project_id) { sql += ' AND ph.project_id = ?'; params.push(project_id); }
  if (task_id)    { sql += ' AND ph.task_id = ?';    params.push(task_id); }
  sql += ' ORDER BY ph.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

/* ── POST /api/photos (multipart/form-data) ─────────────── */
router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se adjuntó ninguna imagen.' });

  const { task_id, project_id, caption } = req.body;
  const id       = uuid();
  const filePath = `/uploads/${req.file.filename}`;

  db.prepare(`
    INSERT INTO photos (id,filename,original_name,path,task_id,project_id,uploaded_by,caption)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(
    id,
    req.file.filename,
    req.file.originalname,
    filePath,
    task_id    || null,
    project_id || null,
    req.user.id,
    caption    || null
  );

  res.status(201).json({ id, path: filePath, filename: req.file.filename });
});

/* ── DELETE /api/photos/:id ─────────────────────────────── */
router.delete('/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Foto no encontrada.' });

  // Delete physical file
  const fullPath = path.join(UPLOAD_DIR, photo.filename);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
