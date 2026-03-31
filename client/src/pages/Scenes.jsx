import React, { useState, useEffect } from 'react';
import { api } from '../api';

const SCENE_ICONS = {
  Night: { emoji: '🌙', gradient: 'from-red-900 to-red-950' },
  Evening: { emoji: '🌅', gradient: 'from-amber-800 to-amber-950' },
  Morning: { emoji: '☀️', gradient: 'from-yellow-700 to-amber-900' },
  Full: { emoji: '💡', gradient: 'from-slate-600 to-slate-800' },
  Movie: { emoji: '🎬', gradient: 'from-indigo-900 to-slate-950' },
  Off: { emoji: '⚫', gradient: 'from-slate-800 to-slate-950' },
};

function SceneCard({ name, scene, onActivate, active }) {
  const icon = SCENE_ICONS[name] || { emoji: '🎨', gradient: 'from-purple-800 to-purple-950' };

  return (
    <button
      onClick={() => onActivate(name)}
      className={`relative rounded-2xl p-4 text-left transition-all bg-gradient-to-br ${icon.gradient} ${
        active === name ? 'ring-2 ring-amber-400' : 'ring-1 ring-slate-700 hover:ring-slate-600'
      }`}
    >
      <div className="text-3xl mb-3">{icon.emoji}</div>
      <div className="font-semibold text-sm">{name}</div>
      {scene.state.bri && (
        <div className="text-xs text-slate-300 mt-0.5">
          {Math.round((scene.state.bri / 254) * 100)}%
        </div>
      )}
      {scene.custom && (
        <div className="absolute top-2 right-3 text-xs text-slate-400">Custom</div>
      )}
    </button>
  );
}

export default function Scenes() {
  const [scenes, setScenes] = useState({});
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    api.getScenes().then(setScenes).catch(() => {});
  }, []);

  async function handleActivate(name) {
    setActive(name);
    await api.activateScene(name);
  }

  async function handleSave() {
    if (!newName.trim()) return;
    setSaving(true);
    await api.saveScene(newName.trim());
    const updated = await api.getScenes();
    setScenes(updated);
    setNewName('');
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(scenes).map(([name, scene]) => (
          <SceneCard
            key={name}
            name={name}
            scene={scene}
            onActivate={handleActivate}
            active={active}
          />
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
        <h3 className="font-medium text-sm">Save current state as scene</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Scene name"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            onClick={handleSave}
            disabled={saving || !newName.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
