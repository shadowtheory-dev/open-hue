import React, { useState } from 'react';
import { api } from '../api';

export default function Setup({ onComplete }) {
  const [step, setStep] = useState('start');
  const [bridges, setBridges] = useState([]);
  const [selectedIp, setSelectedIp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDiscover() {
    setLoading(true);
    setError('');
    try {
      const data = await api.discover();
      if (data.bridges?.length) {
        setBridges(data.bridges);
        setSelectedIp(data.bridges[0].ip);
        setStep('found');
      } else {
        setError('No bridges found on your network');
      }
    } catch {
      setError('Discovery failed. Check your network connection.');
    }
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true);
    setError('');
    try {
      const data = await api.register(selectedIp);
      if (data.success) {
        onComplete();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Could not connect to bridge');
    }
    setLoading(false);
  }

  const [manualIp, setManualIp] = useState('');

  function handleManualConnect() {
    if (!manualIp.trim()) return;
    setSelectedIp(manualIp.trim());
    setBridges([{ id: 'manual', ip: manualIp.trim() }]);
    setStep('found');
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Open Hue</h1>
          <p className="text-slate-400">Local lighting control</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
          {step === 'start' && (
            <>
              <p className="text-slate-300">
                Let's find your Hue Bridge on the network.
              </p>
              <button
                onClick={handleDiscover}
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Find Bridge Automatically'}
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-500">or enter IP manually</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualIp}
                  onChange={e => setManualIp(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualConnect()}
                  placeholder="192.168.1.x"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleManualConnect}
                  disabled={!manualIp.trim()}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-xl text-sm transition-colors disabled:opacity-40"
                >
                  Connect
                </button>
              </div>
            </>
          )}

          {step === 'found' && (
            <>
              <p className="text-slate-300">
                Found {bridges.length} bridge{bridges.length > 1 ? 's' : ''}. Select one and press the physical button on your Hue Bridge, then click Register.
              </p>
              <select
                value={selectedIp}
                onChange={e => setSelectedIp(e.target.value)}
                className="w-full p-3 bg-slate-800 rounded-xl text-slate-100 border border-slate-700"
              >
                {bridges.map(b => (
                  <option key={b.id} value={b.ip}>{b.ip} ({b.id})</option>
                ))}
              </select>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">👆</div>
                <p className="text-sm text-slate-400">Press the link button on your Hue Bridge now</p>
              </div>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button
                onClick={() => setStep('start')}
                className="w-full py-2 text-slate-400 text-sm hover:text-slate-200"
              >
                Back
              </button>
            </>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
