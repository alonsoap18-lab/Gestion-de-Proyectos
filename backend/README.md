# 🏗️ Grupo ICAA Constructora — Sistema de Gestión v2.0

Sistema completo de gestión de construcción, similar a Procore.

---

## ⚡ Inicio Rápido

### Paso 1 — Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

### Paso 2 — Iniciar servidores

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```
→ API corriendo en http://localhost:5000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
→ App corriendo en http://localhost:3000

---

## 🔐 Credenciales

| Campo    | Valor                  |
|----------|------------------------|
| Email    | `admin@grupoicaa.com`  |
| Password | `ICAAadmin2026`        |

**Usuarios de prueba adicionales** (password: `icaa1234`):
- `carlos@grupoicaa.com` — Engineer
- `ana@grupoicaa.com`    — Engineer
- `luis@grupoicaa.com`   — Supervisor
- `pedro@grupoicaa.com`  — Worker
- `maria@grupoicaa.com`  — Worker

---

## 📁 Estructura

```
icaa-v2/
├── backend/
│   ├── server.js                 # Express entry point
│   ├── database/
│   │   └── setup.js              # SQLite schema + seed data
│   ├── middleware/
│   │   └── auth.js               # JWT middleware + role guard
│   └── routes/
│       ├── auth.js               # Login, /me, password change
│       ├── users.js              # CRUD usuarios (Admin only)
│       ├── projects.js           # CRUD proyectos + miembros + Gantt
│       ├── tasks.js              # CRUD tareas + PATCH position (Gantt)
│       ├── calendar.js           # CRUD eventos de calendario
│       ├── photos.js             # Upload de fotos (multer)
│       ├── machinery.js          # CRUD maquinaria
│       ├── materials.js          # CRUD materiales + tracking uso
│       ├── dashboard.js          # KPIs y estadísticas
│       └── logs.js               # Bitácoras diarias de obra
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx              # React entry
│       ├── App.jsx               # Router principal
│       ├── index.css             # Tailwind + design tokens
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state global
│       ├── lib/
│       │   └── api.js            # Axios client
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx   # Navegación lateral colapsable
│       │   │   └── Layout.jsx    # Wrapper de página
│       │   ├── ui/
│       │   │   └── index.jsx     # Badge, Progress, Modal, Confirm, etc.
│       │   └── gantt/
│       │       └── GanttChart.jsx # Gantt interactivo drag & drop
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx     # KPIs + gráficos Recharts
│           ├── Projects.jsx      # Lista con filtros por estado
│           ├── ProjectDetail.jsx # Gantt + Tareas + Equipo + Info
│           ├── Tasks.jsx         # Tabla agrupada por proyecto
│           ├── Employees.jsx     # Cards de empleados
│           ├── Calendar.jsx      # Calendario tipo Google Calendar
│           ├── Reports.jsx       # Análisis + exportación CSV
│           ├── Machinery.jsx     # Inventario de equipos
│           ├── Materials.jsx     # Control de materiales con costos
│           └── Users.jsx         # Admin: gestión de usuarios
│
└── uploads/                      # Fotos subidas (creado automáticamente)
```

---

## 🎯 Módulos del Sistema

| Módulo | Funcionalidades |
|--------|----------------|
| **Dashboard** | KPIs en tiempo real, gráficos de progreso, actividad reciente |
| **Proyectos** | CRUD, filtros por estado, asignación de equipo, progreso auto-calculado |
| **Gantt Chart** | Interactivo — arrastrar/redimensionar barras por semana |
| **Tareas** | CRUD, agrupadas por proyecto, filtros, prioridades, slider de progreso |
| **Empleados** | Gestión de personal con roles, especialidades y estadísticas |
| **Calendario** | Tipo Google Calendar con colores, tipos y filtros por proyecto |
| **Reportes** | 3 tabs: Proyectos / Tareas / Empleados + exportación CSV + impresión |
| **Maquinaria** | Inventario con estado (Disponible/En Uso/Mantenimiento) |
| **Materiales** | Control de inventario, costos, % de consumo, costo total por proyecto |
| **Usuarios** | Solo Admin: CRUD completo de usuarios con roles |

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 4 |
| Base de datos | SQLite via `better-sqlite3` (sin configuración) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Uploads | Multer (hasta 15 MB por foto) |
| Frontend | React 18 + Vite 5 |
| Estilos | Tailwind CSS 3 |
| Estado servidor | TanStack React Query v5 |
| Routing | React Router v6 |
| Gráficos | Recharts |
| Fechas | date-fns |

---

## 🔑 Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **Admin** | Todo el sistema + gestión de usuarios |
| **Engineer** | Proyectos, tareas, reportes, materiales |
| **Supervisor** | Tareas, calendario, maquinaria, bitácoras |
| **Worker** | Ver proyectos y tareas asignadas |

---

## 📊 Datos de Prueba Incluidos

- **3 proyectos**: Residencial Las Palmas (45%), Centro Comercial Alajuela (15%), Bodega Industrial (100%)
- **6 usuarios** con diferentes roles
- **18 tareas** distribuidas en los proyectos
- **6 equipos** de maquinaria
- **8 materiales** con costos y cantidades
- **5 eventos** de calendario

---

*© 2026 Grupo ICAA Constructora. Sistema de Gestión de Construcción.*
