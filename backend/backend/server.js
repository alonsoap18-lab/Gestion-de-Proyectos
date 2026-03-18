// server.js  –  Grupo ICAA Constructora · API Server
'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

/* ── DB init ────────────────────────────────────────────── */
const { init } = require('./database/setup');
init();

/* ── Express setup ──────────────────────────────────────── */
const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

/* ── Static: uploaded photos ────────────────────────────── */
const UPLOADS = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
app.use('/uploads', express.static(UPLOADS));

/* ── Routes ─────────────────────────────────────────────── */
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/calendar',  require('./routes/calendar'));
app.use('/api/photos',    require('./routes/photos'));
app.use('/api/machinery', require('./routes/machinery'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/logs',      require('./routes/logs'));

/* ── Health ─────────────────────────────────────────────── */
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', app: 'ICAA Constructora API', time: new Date().toISOString() })
);

/* ── 404 catch-all ──────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

/* ── Error handler ──────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

/* ── Start ──────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏗️  ICAA Constructora API`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Admin: admin@grupoicaa.com / ICAAadmin2026\n`);
});
