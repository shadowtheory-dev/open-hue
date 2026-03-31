import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { api } from './api';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import LightDetail from './pages/LightDetail';
import Scenes from './pages/Scenes';

export default function App() {
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    api.getSetupStatus().then(data => setConfigured(data.configured)).catch(() => setConfigured(false));
  }, []);

  if (configured === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400 text-lg">Connecting...</div>
      </div>
    );
  }

  if (!configured) {
    return <Setup onComplete={() => setConfigured(true)} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Open Hue</h1>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/light/:id" element={<LightDetail />} />
        <Route path="/scenes" element={<Scenes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800">
        <div className="max-w-2xl mx-auto flex">
          <NavLink to="/" end className={({ isActive }) =>
            `flex-1 py-4 text-center text-sm font-medium transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`
          }>
            Lights
          </NavLink>
          <NavLink to="/scenes" className={({ isActive }) =>
            `flex-1 py-4 text-center text-sm font-medium transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`
          }>
            Scenes
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
