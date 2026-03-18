// src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { StatCard, Progress, Badge, Spinner } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle,
  TrendingUp, Users, Wrench, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TASK_COLORS = { Pending:'#64748b', Started:'#3b82f6', 'In Progress':'#f97316', Completed:'#22c55e' };

const TIP = ({ contentStyle, ...p }) => (
  <Tooltip {...p} contentStyle={{ background:'#1c2333', border:'1px solid #2d3a4f', borderRadius:8, color:'#e2e8f0', fontSize:12, ...contentStyle }}/>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => api.get('/dashboard').then(r => r.data),
  });

  if (isLoading) return <Spinner/>;

  const { projects, tasks, people, machinery, projectProgress, tasksByProject, recentTasks } = stats;

  const taskPieData = [
    { name:'Pendientes',  value: tasks.pending,    color: TASK_COLORS.Pending      },
    { name:'Iniciadas',   value: tasks.started,    color: TASK_COLORS.Started      },
    { name:'En Progreso', value: tasks.inProgress, color: TASK_COLORS['In Progress']},
    { name:'Completadas', value: tasks.completed,  color: TASK_COLORS.Completed    },
  ].filter(d => d.value > 0);

  const barData = projectProgress.map(p => ({
    name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
    Progreso: p.progress,
  }));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Bienvenido, <span className="text-white font-semibold">{user?.name}</span> · Grupo ICAA Constructora
        </p>
      </div>

      {/* Project KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={FolderKanban} label="Total Proyectos" value={projects.total}     color="brand"/>
        <StatCard icon={TrendingUp}   label="Activos"         value={projects.active}    color="green"/>
        <StatCard icon={Clock}        label="En Planificación"value={projects.planning}  color="blue"/>
        <StatCard icon={AlertTriangle}label="Retrasados"      value={projects.delayed}   color="red"/>
        <StatCard icon={CheckSquare}  label="Completados"     value={projects.completed} color="slate"/>
      </div>

      {/* Task KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={CheckSquare} label="Total Tareas"  value={tasks.total}      color="brand"/>
        <StatCard icon={Clock}       label="Pendientes"    value={tasks.pending}    color="yellow"/>
        <StatCard icon={TrendingUp}  label="En Progreso"   value={tasks.inProgress} color="brand"/>
        <StatCard icon={CheckSquare} label="Completadas"   value={tasks.completed}  color="green"/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Progress per project */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title text-sm mb-4">Progreso por Proyecto</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ bottom:50, left:-20, right:10 }}>
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10 }} angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} domain={[0,100]}/>
                <TIP formatter={v => [`${v}%`, 'Progreso']}/>
                <Bar dataKey="Progreso" fill="#f97316" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Sin datos</div>
          )}
        </div>

        {/* Task pie */}
        <div className="card p-5">
          <h3 className="section-title text-sm mb-4">Tareas por Estado</h3>
          {taskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskPieData} cx="50%" cy="45%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                  {taskPieData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                </Pie>
                <TIP/>
                <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8', paddingTop:8 }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Sin tareas</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Project list */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-sm">Estado de Proyectos</h3>
            <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Ver todos <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-3">
            {projectProgress.slice(0, 6).map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="block group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-200 truncate group-hover:text-brand-400 transition-colors">{p.name}</span>
                  <Badge status={p.status}/>
                </div>
                <Progress value={p.progress} size="xs" showLabel={false}/>
              </Link>
            ))}
            {projectProgress.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin proyectos</p>}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-sm">Actividad Reciente</h3>
            <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Ver todas <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-2">
            {recentTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-t border-surface-600/50 first:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{t.name}</div>
                  <div className="text-xs text-slate-500 truncate">{t.project_name} · {t.assigned_name || 'Sin asignar'}</div>
                </div>
                <Badge status={t.status}/>
              </div>
            ))}
            {recentTasks.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin actividad</p>}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-3xl font-display font-black text-white">{people.total}</div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
            <Users size={11}/> Empleados Activos
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-display font-black text-green-400">{machinery.Available || 0}</div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
            <Wrench size={11}/> Maquinaria Disponible
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-display font-black text-brand-400">
            {projects.total > 0 ? Math.round(projectProgress.reduce((s, p) => s + p.progress, 0) / projects.total) : 0}%
          </div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
            <TrendingUp size={11}/> Avance General
          </div>
        </div>
      </div>
    </div>
  );
}
