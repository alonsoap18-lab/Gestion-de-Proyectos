// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  Calendar, BarChart3, Wrench, Package, UserCog,
  LogOut, HardHat, ChevronLeft, ChevronRight
} from 'lucide-react';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/projects',  icon: FolderKanban,    label: 'Proyectos'  },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tareas'     },
  { to: '/employees', icon: Users,           label: 'Empleados'  },
  { to: '/calendar',  icon: Calendar,        label: 'Calendario' },
  { to: '/reports',   icon: BarChart3,       label: 'Reportes'   },
  { to: '/machinery', icon: Wrench,          label: 'Maquinaria' },
  { to: '/materials', icon: Package,         label: 'Materiales' },
  { to: '/users',     icon: UserCog,         label: 'Usuarios',  adminOnly: true },
];

const ROLE_COLOR = {
  Admin:      'text-brand-400',
  Engineer:   'text-blue-400',
  Supervisor: 'text-purple-400',
  Worker:     'text-slate-400',
};

export default function Sidebar({ collapsed, toggle }) {
  const { user, logout } = useAuth();
  const loc = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-surface-800 border-r border-surface-600
                  flex flex-col z-40 transition-all duration-200 select-none
                  ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-surface-600 min-h-[60px]
                       ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-brand">
          <HardHat size={17} className="text-white"/>
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-white uppercase tracking-widest">ICAA</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Constructora</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, adminOnly }) => {
          if (adminOnly && user?.role !== 'Admin') return null;
          const active = to === '/'
            ? loc.pathname === '/'
            : loc.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium
                          transition-all duration-100 group
                          ${active
                            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-surface-600 border border-transparent'
                          }`}
            >
              <Icon size={17} className={`flex-shrink-0 ${active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`}/>
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-600 p-2 space-y-1">
        {!collapsed && (
          <div className="px-2.5 py-2 rounded-lg bg-surface-700 mb-1">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${ROLE_COLOR[user?.role] || 'text-slate-400'}`}>
              {user?.role}
            </div>
          </div>
        )}
        <button onClick={logout} title="Cerrar sesión"
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-400
                     hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
          <LogOut size={16} className="flex-shrink-0"/>
          {!collapsed && 'Cerrar sesión'}
        </button>
        <button onClick={toggle}
          className="w-full flex items-center justify-center py-1.5 rounded-lg text-slate-600
                     hover:text-slate-400 hover:bg-surface-700 transition-all">
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>
    </aside>
  );
}
