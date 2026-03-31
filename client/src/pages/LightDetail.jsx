import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function hueToHex(hue, sat, bri) {
  const h = (hue / 65535) * 360;
  const s = (sat / 254) * 100;
  const l = ((bri / 254) * 50) + 20;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function ctToLabel(ct) {
  if (ct < 250) return 'Cool White';
  if (ct < 350) return 'Neutral';
  if (ct < 420) return 'Warm White';
  return 'Candlelight';
}

export default function LightDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [light, setLight] = useState(null);
  const [bri, setBri] = useState(127);
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(254);
  const [ct, setCt] = useState(300);
  const [mode, setMode] = useState('color');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getLights().then(data => {
      const l = data[id];
      if (l) {
        setLight(l);
        setBri(l.state.bri || 127);
        if (l.state.hue !== undefined) setHue(l.state.hue);
        if (l.state.sat !== undefined) setSat(l.state.sat);
        if (l.state.ct !== undefined) setCt(l.state.ct);
        setMode(l.state.colormode === 'ct' ? 'temp' : 'color');
      }
    });
  }, [id]);

  const sendState = useCallback(async (state) => {
    if (sending) return;
    setSending(true);
    await api.setLightState(id, state);
    setSending(false);
  }, [id, sending]);

  if (!light) {
    return <div className="text-center text-slate-400 py-12">Loading...</div>;
  }

  const isOn = light.state.on;
  const previewColor = mode === 'color'
    ? hueToHex(hue, sat, bri)
    : `hsl(30, ${100 - ((ct - 153) / (500 - 153)) * 60}%, ${(bri / 254) * 50 + 25}%)`;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-200 text-sm">
        &larr; Back
      </button>

      <div className="text-center">
        <div
          className="w-24 h-24 rounded-full mx-auto mb-4 transition-colors ring-4 ring-slate-800"
          style={{ backgroundColor: isOn ? previewColor : '#334155' }}
        />
        <h2 className="text-xl font-bold">{light.name}</h2>
        <p className="text-sm text-slate-400 mt-1">{light.type}</p>
      </div>

      {/* Power toggle */}
      <div className="flex items-center justify-between bg-slate-900 rounded-xl p-4">
        <span className="font-medium">Power</span>
        <button
          onClick={() => {
            const newOn = !isOn;
            setLight(prev => ({ ...prev, state: { ...prev.state, on: newOn } }));
            sendState({ on: newOn });
          }}
          className={`w-14 h-8 rounded-full transition-colors relative ${
            isOn ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white transition-transform ${
            isOn ? 'left-7' : 'left-1.5'
          }`} />
        </button>
      </div>

      {/* Brightness */}
      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Brightness</span>
          <span className="text-slate-400">{Math.round((bri / 254) * 100)}%</span>
        </div>
        <input
          type="range" min="1" max="254" value={bri}
          onChange={e => { const v = +e.target.value; setBri(v); }}
          onMouseUp={() => sendState({ bri })}
          onTouchEnd={() => sendState({ bri })}
          className="w-full"
        />
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-900 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode('color')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'color' ? 'bg-slate-700 text-white' : 'text-slate-400'
          }`}
        >
          Colour
        </button>
        <button
          onClick={() => setMode('temp')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'temp' ? 'bg-slate-700 text-white' : 'text-slate-400'
          }`}
        >
          Temperature
        </button>
      </div>

      {mode === 'color' && (
        <div className="bg-slate-900 rounded-xl p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Hue</span>
              <span className="text-slate-400">{hue}</span>
            </div>
            <input
              type="range" min="0" max="65535" value={hue}
              onChange={e => setHue(+e.target.value)}
              onMouseUp={() => sendState({ hue, sat })}
              onTouchEnd={() => sendState({ hue, sat })}
              className="w-full"
              style={{
                background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
              }}
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Saturation</span>
              <span className="text-slate-400">{Math.round((sat / 254) * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="254" value={sat}
              onChange={e => setSat(+e.target.value)}
              onMouseUp={() => sendState({ hue, sat })}
              onTouchEnd={() => sendState({ hue, sat })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {mode === 'temp' && (
        <div className="bg-slate-900 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Colour Temperature</span>
            <span className="text-slate-400">{ctToLabel(ct)}</span>
          </div>
          <input
            type="range" min="153" max="500" value={ct}
            onChange={e => setCt(+e.target.value)}
            onMouseUp={() => sendState({ ct })}
            onTouchEnd={() => sendState({ ct })}
            className="w-full"
            style={{
              background: 'linear-gradient(to right, #cce0ff, #fff5e6, #ffcc66)',
            }}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Cool</span>
            <span>Warm</span>
          </div>
        </div>
      )}
    </div>
  );
}
