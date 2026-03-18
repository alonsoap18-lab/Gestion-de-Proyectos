// routes/dashboard.js
const express = require('express');
const { db }  = require('../database/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/* ── GET /api/dashboard ─────────────────────────────────── */
router.get('/', (req, res) => {

  /* ── Projects stats ── */
  const pAll  = db.prepare('SELECT id,name,status,progress,budget,spent FROM projects').all();
  const totalProjects     = pAll.length;
  const activeProjects    = pAll.filter(p => p.status === 'Active').length;
  const completedProjects = pAll.filter(p => p.status === 'Completed').length;
  const delayedProjects   = pAll.filter(p => p.status === 'Delayed').length;
  const planningProjects  = pAll.filter(p => p.status === 'Planning').length;
  const totalBudget       = pAll.reduce((s, p) => s + (p.budget || 0), 0);

  /* ── Task stats ── */
  const tAll  = db.prepare('SELECT status FROM tasks').all();
  const totalTasks     = tAll.length;
  const pendingTasks   = tAll.filter(t => t.status === 'Pending').length;
  const startedTasks   = tAll.filter(t => t.status === 'Started').length;
  const inProgTasks    = tAll.filter(t => t.status === 'In Progress').length;
  const completedTasks = tAll.filter(t => t.status === 'Completed').length;

  /* ── People stats ── */
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users WHERE active=1').get().c;

  /* ── Machinery stats ── */
  const machStats = db.prepare(`
    SELECT status, COUNT(*) AS c FROM machinery GROUP BY status
  `).all().reduce((acc, r) => { acc[r.status] = r.c; return acc; }, {});

  /* ── Project progress list (for chart) ── */
  const projectProgress = pAll.map(p => ({
    id: p.id, name: p.name, progress: p.progress, status: p.status
  }));

  /* ── Task breakdown per project ── */
  const tasksByProject = db.prepare(`
    SELECT p.name AS project_name,
           COUNT(*) AS total,
           SUM(CASE WHEN t.status='Completed' THEN 1 ELSE 0 END) AS completed
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    GROUP BY t.project_id
    ORDER BY total DESC
    LIMIT 8
  `).all();

  /* ── Recent activity (last 10 updated tasks) ── */
  const recentTasks = db.prepare(`
    SELECT t.id, t.name, t.status, t.progress, t.created_at,
           p.name AS project_name,
           u.name AS assigned_name
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN users    u ON u.id = t.assigned_to
    ORDER BY t.created_at DESC
    LIMIT 8
  `).all();

  res.json({
    projects: {
      total: totalProjects, active: activeProjects, completed: completedProjects,
      delayed: delayedProjects, planning: planningProjects, totalBudget,
    },
    tasks: {
      total: totalTasks, pending: pendingTasks, started: startedTasks,
      inProgress: inProgTasks, completed: completedTasks,
    },
    people: { total: totalUsers },
    machinery: machStats,
    projectProgress,
    tasksByProject,
    recentTasks,
  });
});

module.exports = router;
