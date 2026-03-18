// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout     from './components/layout/Layout';

import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Projects      from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks         from './pages/Tasks';
import Employees     from './pages/Employees';
import Calendar      from './pages/Calendar';
import Reports       from './pages/Reports';
import Machinery     from './pages/Machinery';
import Materials     from './pages/Materials';
import Users         from './pages/Users';

function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace/>;
}
function AdminOnly({ children }) {
  const { user } = useAuth();
  if (!user)                 return <Navigate to="/login" replace/>;
  if (user.role !== 'Admin') return <Navigate to="/"      replace/>;
  return children;
}
const Page      = ({ el }) => <Private><Layout>{el}</Layout></Private>;
const AdminPage = ({ el }) => <AdminOnly><Layout>{el}</Layout></AdminOnly>;

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"         element={user ? <Navigate to="/" replace/> : <Login/>}/>
      <Route path="/"              element={<Page el={<Dashboard/>}/>}/>
      <Route path="/projects"      element={<Page el={<Projects/>}/>}/>
      <Route path="/projects/:id"  element={<Page el={<ProjectDetail/>}/>}/>
      <Route path="/tasks"         element={<Page el={<Tasks/>}/>}/>
      <Route path="/employees"     element={<Page el={<Employees/>}/>}/>
      <Route path="/calendar"      element={<Page el={<Calendar/>}/>}/>
      <Route path="/reports"       element={<Page el={<Reports/>}/>}/>
      <Route path="/machinery"     element={<Page el={<Machinery/>}/>}/>
      <Route path="/materials"     element={<Page el={<Materials/>}/>}/>
      <Route path="/users"         element={<AdminPage el={<Users/>}/>}/>
      <Route path="*"              element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
