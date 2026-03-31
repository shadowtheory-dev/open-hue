const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export const api = {
  // Setup
  getSetupStatus: () => request('/setup/status'),
  discover: () => request('/setup/discover', { method: 'POST' }),
  register: (bridgeIp) => request('/setup/register', {
    method: 'POST',
    body: JSON.stringify({ bridgeIp }),
  }),

  // Lights
  getLights: () => request('/lights'),
  setLightState: (id, state) => request(`/lights/${id}/state`, {
    method: 'PUT',
    body: JSON.stringify(state),
  }),
  setAllLights: (state) => request('/lights/all', {
    method: 'PUT',
    body: JSON.stringify(state),
  }),

  // Scenes
  getScenes: () => request('/scenes'),
  activateScene: (name) => request(`/scenes/${name}`, { method: 'POST' }),
  saveScene: (name) => request(`/scenes/${name}`, { method: 'PUT' }),
};
