import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

function lightColor(state) {
  if (!state.on) return 'bg-slate-700';
  if (state.hue !== undefined && state.sat !== undefined) {
    const h = Math.round((state.hue / 65535) * 360);
    const s = Math.round((state.sat / 254) * 100);
    const l = Math.round((state.bri / 254) * 50) + 20;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  if (state.ct) {
    const warmth = (state.ct - 153) / (500 - 153);
    if (warmth < 0.3) return 'bg-blue-100';
    if (warmth < 0.6) return 'bg-amber-100';
    return 'bg-orange-200';
  }
  return 'bg-amber-300';
}

function LightCard({ id, light, onToggle }) {
  const navigate = useNavigate();
  const isOn = light.state.on;
  const bri = isOn ? Math.round((light.state.bri / 254) * 100) : 0;
  const color = lightColor(light.state);
  const isHsl = color.startsWith('hsl');

  return (
    <div
      className={`relative rounded-2xl p-4 cursor-pointer transition-all ${
        isOn ? 'bg-slate-800 ring-1 ring-slate-700' : 'bg-slate-900 ring-1 ring-slate-800'
      }`}
      onClick={() => navigate(`/light/${id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-full ${isHsl ? '' : color} transition-colors`}
          style={isHsl ? { backgroundColor: color } : undefined}
        />
        <button
          onClick={e => { e.stopPropagation(); onToggle(id, !isOn); }}
          className={`w-12 h-7 rounded-full transition-colors relative ${
            isOn ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            isOn ? 'left-6' : 'left-1'
          }`} />
        </button>
      </div>
      <div className="font-medium text-sm truncate">{light.name}</div>
      <div className="text-xs text-slate-400 mt-0.5">
        {isOn ? `${bri}%` : 'Off'}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [lights, setLights] = useState({});
  const [loading, setLoading] = useState(true);

  async function fetchLights() {
    try {
      const data = await api.getLights();
      if (!data.error) setLights(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchLights();
    const interval = setInterval(fetchLights, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggle(id, on) {
    setLights(prev => ({
      ...prev,
      [id]: { ...prev[id], state: { ...prev[id].state, on } },
    }));
    await api.setLightState(id, { on });
  }

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading lights...</div>;
  }

  const entries = Object.entries(lights);
  if (!entries.length) {
    return <div className="text-center text-slate-400 py-12">No lights found</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map(([id, light]) => (
        <LightCard key={id} id={id} light={light} onToggle={handleToggle} />
      ))}
    </div>
  );
}
