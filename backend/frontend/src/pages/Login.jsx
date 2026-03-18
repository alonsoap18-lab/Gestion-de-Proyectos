// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HardHat, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email,    setEmail]    = useState('admin@grupoicaa.com');
  const [password, setPassword] = useState('ICAAadmin2026');
  const [error,    setError]    = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.ok) navigate('/');
    else setError(res.error);
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 -right-56 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl"/>
        <div className="absolute -bottom-56 -left-56 w-[600px] h-[600px] bg-brand-600/4 rounded-full blur-3xl"/>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(249,115,22,0.07) 1px, transparent 0)', backgroundSize: '40px 40px' }}/>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-brand-500 rounded-2xl items-center justify-center mb-4 shadow-brand">
            <HardHat size={30} className="text-white"/>
          </div>
          <h1 className="font-display text-5xl font-black text-white uppercase tracking-widest">ICAA</h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.3em] mt-1 font-semibold">Grupo Constructora</p>
        </div>

        {/* Card */}
        <div className="card p-7 shadow-2xl">
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-5">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              <AlertCircle size={15}/> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="field">
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input type="email" className="input pl-9" value={email}
                  onChange={e => setEmail(e.target.value)} required placeholder="correo@grupoicaa.com"/>
              </div>
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input type="password" className="input pl-9" value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"/>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-base font-display uppercase tracking-widest mt-2">
              {loading ? <Loader2 size={16} className="animate-spin"/> : null}
              {loading ? 'Autenticando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-surface-600">
            <div className="bg-surface-700 rounded-lg p-3 font-mono text-xs space-y-1">
              <div><span className="text-slate-500">usuario: </span><span className="text-brand-400">admin@grupoicaa.com</span></div>
              <div><span className="text-slate-500">clave:   </span><span className="text-brand-400">ICAAadmin2026</span></div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Grupo ICAA Constructora
        </p>
      </div>
    </div>
  );
}
