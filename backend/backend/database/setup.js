// database/setup.js
// Grupo ICAA Constructora - Database Initialization & Seed

const Database = require('better-sqlite3');
const bcrypt    = require('bcryptjs');
const { v4: uuid } = require('uuid');
const path      = require('path');
const fs        = require('fs');

// Ensure DB directory exists
const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'icaa.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys  = ON');

/* ─────────────────────────────────────────────────────────
   SCHEMA
───────────────────────────────────────────────────────── */
function createSchema() {
  db.exec(`
    /* ── Users ─────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'Worker',
      position    TEXT,
      specialty   TEXT,
      phone       TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Projects ───────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS projects (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      client          TEXT,
      location        TEXT,
      start_date      TEXT,
      duration_weeks  INTEGER NOT NULL DEFAULT 12,
      status          TEXT NOT NULL DEFAULT 'Planning',
      progress        INTEGER NOT NULL DEFAULT 0,
      description     TEXT,
      budget          REAL   NOT NULL DEFAULT 0,
      spent           REAL   NOT NULL DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Project members ────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS project_members (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
      project_role TEXT NOT NULL DEFAULT 'Member',
      UNIQUE(project_id, user_id)
    );

    /* ── Tasks ──────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      start_week  INTEGER NOT NULL DEFAULT 1,
      end_week    INTEGER NOT NULL DEFAULT 2,
      status      TEXT NOT NULL DEFAULT 'Pending',
      progress    INTEGER NOT NULL DEFAULT 0,
      priority    TEXT NOT NULL DEFAULT 'Medium',
      description TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Calendar events ────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS calendar_events (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      start_date  TEXT NOT NULL,
      end_date    TEXT,
      type        TEXT NOT NULL DEFAULT 'Task',
      project_id  TEXT REFERENCES projects(id) ON DELETE SET NULL,
      user_id     TEXT REFERENCES users(id)    ON DELETE SET NULL,
      color       TEXT NOT NULL DEFAULT '#f97316',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Photos ─────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS photos (
      id            TEXT PRIMARY KEY,
      filename      TEXT NOT NULL,
      original_name TEXT,
      path          TEXT NOT NULL,
      task_id       TEXT REFERENCES tasks(id)    ON DELETE SET NULL,
      project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,
      uploaded_by   TEXT REFERENCES users(id)    ON DELETE SET NULL,
      caption       TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Machinery ──────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS machinery (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      type          TEXT,
      brand         TEXT,
      model         TEXT,
      serial_number TEXT,
      status        TEXT NOT NULL DEFAULT 'Available',
      project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,
      notes         TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Materials ──────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS materials (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      unit          TEXT NOT NULL DEFAULT 'units',
      quantity      REAL NOT NULL DEFAULT 0,
      used_quantity REAL NOT NULL DEFAULT 0,
      cost_per_unit REAL NOT NULL DEFAULT 0,
      project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,
      supplier      TEXT,
      notes         TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Daily logs ─────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS daily_logs (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
      log_date    TEXT NOT NULL,
      weather     TEXT,
      workers     INTEGER DEFAULT 0,
      notes       TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/* ─────────────────────────────────────────────────────────
   SEED DATA
───────────────────────────────────────────────────────── */
function seed() {
  // Admin already exists? skip
  if (db.prepare('SELECT id FROM users WHERE email = ?').get('admin@grupoicaa.com')) return;

  const HASH_ADMIN  = bcrypt.hashSync('ICAAadmin2026', 10);
  const HASH_USER   = bcrypt.hashSync('icaa1234', 10);

  /* Users */
  const adminId  = uuid();
  const eng1Id   = uuid();
  const eng2Id   = uuid();
  const sup1Id   = uuid();
  const w1Id     = uuid();
  const w2Id     = uuid();

  const insUser = db.prepare(`
    INSERT INTO users (id,name,email,password,role,position,specialty,phone)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  insUser.run(adminId, 'Administrador ICAA',   'admin@grupoicaa.com',   HASH_ADMIN, 'Admin',      'Administrador General',  'Administración',          '+506 2222-0000');
  insUser.run(eng1Id,  'Carlos Méndez Rojas',  'carlos@grupoicaa.com',  HASH_USER,  'Engineer',   'Ingeniero Civil',        'Estructuras',             '+506 8811-1234');
  insUser.run(eng2Id,  'Ana Rodríguez Mora',   'ana@grupoicaa.com',     HASH_USER,  'Engineer',   'Ingeniera Eléctrica',    'Instalaciones Eléctricas','+506 8822-5678');
  insUser.run(sup1Id,  'Luis Torres Vargas',   'luis@grupoicaa.com',    HASH_USER,  'Supervisor', 'Supervisor de Obra',     'Construcción General',    '+506 8833-9012');
  insUser.run(w1Id,    'Pedro Jiménez Quesada','pedro@grupoicaa.com',   HASH_USER,  'Worker',     'Operario',               'Albañilería',             '+506 8844-3456');
  insUser.run(w2Id,    'María Solís Castro',   'maria@grupoicaa.com',   HASH_USER,  'Worker',     'Técnico Eléctrico',      'Electricidad',            '+506 8855-7890');

  /* Projects */
  const p1Id = uuid();
  const p2Id = uuid();
  const p3Id = uuid();

  const insProject = db.prepare(`
    INSERT INTO projects (id,name,client,location,start_date,duration_weeks,status,progress,description,budget)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);
  insProject.run(p1Id,'Residencial Las Palmas',   'Inversiones Garza S.A.',   'San José, Costa Rica',  '2026-01-05',24,'Active',   45,'Complejo residencial de 24 apartamentos con amenidades completas.',      850000);
  insProject.run(p2Id,'Centro Comercial Alajuela','Grupo Comercial Norte S.A.','Alajuela, Costa Rica', '2026-02-02',36,'Active',   15,'Centro comercial con 40 locales, área de comidas y estacionamiento.',   2300000);
  insProject.run(p3Id,'Bodega Industrial Cartago', 'LogiCR Almacenes S.A.',   'Cartago, Costa Rica',   '2025-09-01',16,'Completed',100,'Bodega industrial de 3000 m² con zona de carga y descarga.',             640000);

  /* Project members */
  const insMember = db.prepare(`
    INSERT OR IGNORE INTO project_members (id,project_id,user_id,project_role) VALUES (?,?,?,?)
  `);
  insMember.run(uuid(),p1Id,eng1Id,'Engineer');
  insMember.run(uuid(),p1Id,sup1Id,'Supervisor');
  insMember.run(uuid(),p1Id,w1Id,  'Worker');
  insMember.run(uuid(),p2Id,eng2Id,'Engineer');
  insMember.run(uuid(),p2Id,sup1Id,'Supervisor');
  insMember.run(uuid(),p3Id,eng1Id,'Engineer');
  insMember.run(uuid(),p3Id,w2Id,  'Worker');

  /* Tasks */
  const insTask = db.prepare(`
    INSERT INTO tasks (id,name,project_id,assigned_to,start_week,end_week,status,progress,priority,description)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);
  // Project 1
  insTask.run(uuid(),'Movimiento de tierras',              p1Id,eng1Id, 1, 3, 'Completed',100,'High',  'Excavación y nivelación del terreno.');
  insTask.run(uuid(),'Fundaciones y cimentación',          p1Id,eng1Id, 3, 6, 'Completed',100,'High',  'Zapatas y vigas de cimentación.');
  insTask.run(uuid(),'Estructura de concreto nivel 1',     p1Id,sup1Id, 6,10, 'In Progress',65,'High', 'Columnas, vigas y losa nivel 1.');
  insTask.run(uuid(),'Estructura de concreto nivel 2',     p1Id,sup1Id,10,14, 'Pending',     0,'High', 'Columnas, vigas y losa nivel 2.');
  insTask.run(uuid(),'Instalaciones eléctricas nivel 1',   p1Id,eng2Id, 9,14, 'Pending',     0,'Medium','Canalizaciones y cableado nivel 1.');
  insTask.run(uuid(),'Levantado de paredes nivel 1',       p1Id,w1Id,  10,16, 'Pending',     0,'Medium','Blocks de concreto división interna.');
  insTask.run(uuid(),'Repello y acabados nivel 1',         p1Id,w1Id,  16,20, 'Pending',     0,'Low',  'Repello fino y pintura base.');
  insTask.run(uuid(),'Instalaciones hidrosanitarias',      p1Id,sup1Id,12,18, 'Pending',     0,'Medium','Tuberías de agua y drenajes.');
  // Project 2
  insTask.run(uuid(),'Estudio de suelos',                  p2Id,eng1Id, 1, 2, 'Completed',100,'High',  'Sondeos y análisis de laboratorio.');
  insTask.run(uuid(),'Diseño estructural y arquitectónico',p2Id,eng2Id, 1, 5, 'In Progress', 75,'High','Planos finales para trámite de permiso.');
  insTask.run(uuid(),'Trámite de permisos municipales',    p2Id,eng2Id, 3, 8, 'In Progress', 40,'High','CFIA, Municipalidad y SETENA.');
  insTask.run(uuid(),'Movimiento de tierras',              p2Id,sup1Id, 8,11, 'Pending',     0,'High', 'Corte y relleno según diseño.');
  insTask.run(uuid(),'Fundaciones',                        p2Id,eng1Id,11,15, 'Pending',     0,'High', 'Sistema de fundaciones profundas.');
  // Project 3 (completed)
  insTask.run(uuid(),'Movimiento de tierras',              p3Id,eng1Id, 1, 2, 'Completed',100,'High',  '');
  insTask.run(uuid(),'Losa de concreto industrial',        p3Id,eng1Id, 2, 6, 'Completed',100,'High',  '');
  insTask.run(uuid(),'Estructura metálica',                p3Id,sup1Id, 5,10, 'Completed',100,'High',  '');
  insTask.run(uuid(),'Cubierta y cerramientos',            p3Id,w2Id,   9,13, 'Completed',100,'Medium','');
  insTask.run(uuid(),'Instalaciones y acabados',           p3Id,w2Id,  12,16, 'Completed',100,'Medium','');

  /* Calendar events */
  const insEvent = db.prepare(`
    INSERT INTO calendar_events (id,title,description,start_date,end_date,type,project_id,user_id,color)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  insEvent.run(uuid(),'Reunión de avance semanal',   'Revisión de progreso del proyecto',        '2026-03-23','2026-03-23','Meeting',   p1Id,adminId,'#3b82f6');
  insEvent.run(uuid(),'Inspección de cimentación',   'Revisión de calidad con inspector CFIA',   '2026-03-25','2026-03-25','Inspection',p1Id,eng1Id, '#8b5cf6');
  insEvent.run(uuid(),'Entrega de planos finales',   'Entrega al municipio de Alajuela',         '2026-03-28','2026-03-28','Delivery',  p2Id,eng2Id, '#22c55e');
  insEvent.run(uuid(),'Reunión con cliente CCNSA',   'Actualización de cronograma',              '2026-04-01','2026-04-01','Meeting',   p2Id,adminId,'#3b82f6');
  insEvent.run(uuid(),'Colada de losa nivel 1',      'Colada programada 06:00am',                '2026-04-07','2026-04-07','Task',      p1Id,sup1Id, '#f97316');

  /* Machinery */
  const insMach = db.prepare(`
    INSERT INTO machinery (id,name,type,brand,model,serial_number,status,project_id,notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  insMach.run(uuid(),'Excavadora de Cadenas 320',  'Excavadora', 'CAT',     '320GX','CAT-320-2021-001','In Use',     p1Id,'Arrendada, contrato hasta Junio 2026');
  insMach.run(uuid(),'Grúa Torre 40m',             'Grúa',       'Liebherr', '280EC','LH-280-2020-088','In Use',     p1Id,'Capacidad 8 toneladas');
  insMach.run(uuid(),'Retroexcavadora JD 310',     'Retroexcavadora','John Deere','310SL','JD-310-2019-045','Available',null,'Libre desde fin proyecto Cartago');
  insMach.run(uuid(),'Compactadora de suelo',      'Compactadora','Wacker Neuson','DS70','WN-DS70-2022-011','Available',null,'');
  insMach.run(uuid(),'Mezcladora de Concreto 1m³', 'Mezcladora', 'FIORI',   'DB 260','FI-260-2020-033','Maintenance',null,'En taller: cambio de motor hidráulico');
  insMach.run(uuid(),'Pluma Hidráulica 5T',        'Pluma',      'Yale',    'PH5000','YL-PH5-2018-009','Available',  null,'');

  /* Materials */
  const insMat = db.prepare(`
    INSERT INTO materials (id,name,unit,quantity,used_quantity,cost_per_unit,project_id,supplier,notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  insMat.run(uuid(),'Concreto premezclado 210 kg/cm²','m³',   500,220,  85,   p1Id,'Concretera Holcim S.A.',  'Pedidos mínimos 6m³');
  insMat.run(uuid(),'Varilla corrugada #4',            'kg', 12000,5500,  1.25,p1Id,'Aceros TICO S.A.',        '');
  insMat.run(uuid(),'Varilla corrugada #6',            'kg',  8000,3100,  1.80,p1Id,'Aceros TICO S.A.',        '');
  insMat.run(uuid(),'Blocks de concreto 15x20x40',     'u',  15000,   0,  0.55,p1Id,'Blocks del Sur S.A.',    'Entrega programada semana 10');
  insMat.run(uuid(),'Cemento Portland tipo I',         'saco', 800, 310,  8.50,p1Id,'CEMEX Costa Rica',        '');
  insMat.run(uuid(),'Acero estructural A36',           'kg',  9500,   0,  1.95,p2Id,'Metal Sur S.A.',          'Para estructura metálica principal');
  insMat.run(uuid(),'Arena de río lavada',             'm³',   200,  80,  22,  p2Id,'Arenas del Norte S.A.',   '');
  insMat.run(uuid(),'Piedrín ¾"',                     'm³',   180,  60,  28,  p2Id,'Quebradores La Unión',    '');

  console.log('✅  Seed data inserted successfully');
}

/* ─────────────────────────────────────────────────────────
   HELPERS used by routes
───────────────────────────────────────────────────────── */
function recalcProjectProgress(projectId) {
  const row = db.prepare(
    'SELECT COALESCE(AVG(progress),0) AS avg FROM tasks WHERE project_id = ?'
  ).get(projectId);
  const progress = Math.round(row.avg);
  db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(progress, projectId);
  return progress;
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
function init() {
  createSchema();
  seed();
}

module.exports = { db, init, recalcProjectProgress };

// Allow direct run: node database/setup.js
if (require.main === module) { init(); }
