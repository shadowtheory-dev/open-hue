const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const hue = require('./hue');
const scenes = require('./scenes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve built React app in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve R1 creation
app.use('/r1', express.static(path.join(__dirname, '../r1')));

// --- Setup status ---
app.get('/api/setup/status', async (req, res) => {
  const cfg = config.load();
  if (cfg.bridgeIp && cfg.username) {
    return res.json({ configured: true, bridgeIp: cfg.bridgeIp });
  }
  res.json({ configured: false });
});

app.post('/api/setup/discover', async (req, res) => {
  try {
    const bridges = await hue.discover();
    res.json({ bridges });
  } catch (err) {
    res.status(500).json({ error: 'Discovery failed: ' + err.message });
  }
});

app.post('/api/setup/register', async (req, res) => {
  const { bridgeIp } = req.body;
  if (!bridgeIp) return res.status(400).json({ error: 'bridgeIp required' });
  try {
    const username = await hue.register(bridgeIp);
    config.save({ bridgeIp, username });
    res.json({ success: true, bridgeIp, username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Middleware: ensure configured ---
function requireSetup(req, res, next) {
  const cfg = config.load();
  if (!cfg.bridgeIp || !cfg.username) {
    return res.status(503).json({ error: 'Bridge not configured. Complete setup first.' });
  }
  req.bridgeIp = cfg.bridgeIp;
  req.username = cfg.username;
  next();
}

// --- Lights ---
app.get('/api/lights', requireSetup, async (req, res) => {
  try {
    const lights = await hue.getLights(req.bridgeIp, req.username);
    res.json(lights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lights/:id/state', requireSetup, async (req, res) => {
  try {
    const result = await hue.setLightState(req.bridgeIp, req.username, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lights/all', requireSetup, async (req, res) => {
  try {
    const result = await hue.setAllLights(req.bridgeIp, req.username, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Groups ---
app.get('/api/groups', requireSetup, async (req, res) => {
  try {
    const groups = await hue.getGroups(req.bridgeIp, req.username);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Scenes ---
app.get('/api/scenes', (req, res) => {
  res.json(scenes.list());
});

app.post('/api/scenes/:name', requireSetup, async (req, res) => {
  const scene = scenes.get(req.params.name);
  if (!scene) return res.status(404).json({ error: 'Scene not found' });
  try {
    await hue.setAllLights(req.bridgeIp, req.username, scene.state);
    // Give bridge time to apply the transition before reading back
    await new Promise(r => setTimeout(r, 500));
    const lights = await hue.getLights(req.bridgeIp, req.username);
    const state = deriveState(lights);
    res.json({ activated: req.params.name, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/scenes/:name', requireSetup, async (req, res) => {
  try {
    const lights = await hue.getLights(req.bridgeIp, req.username);
    const firstLight = Object.values(lights)[0];
    if (!firstLight) return res.status(400).json({ error: 'No lights found' });
    const { on, bri, hue, sat, ct } = firstLight.state;
    scenes.save(req.params.name, { on, bri, hue, sat, ct });
    res.json({ saved: req.params.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Status ---
app.get('/api/status', requireSetup, async (req, res) => {
  try {
    const lights = await hue.getLights(req.bridgeIp, req.username);
    const state = deriveState(lights);
    res.json({ state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function deriveState(lights) {
  const lightList = Object.values(lights);
  const anyOn = lightList.some(l => l.state && l.state.on);
  const briValues = lightList.filter(l => l.state && l.state.on && l.state.bri !== undefined).map(l => l.state.bri);
  const avgBri = briValues.length > 0 ? Math.round(briValues.reduce((a, b) => a + b, 0) / briValues.length) : 0;
  const brightnessPercent = Math.round((avgBri / 254) * 100);
  return {
    lights: anyOn,
    brightness: brightnessPercent,
    heater: false,
    temp: null,
    presence: null,
  };
}

// --- Webhook stubs (structured for future use) ---
app.post('/api/webhook/motion', (req, res) => {
  res.json({ received: true, note: 'Motion webhook not yet implemented' });
});

app.post('/api/webhook/presence', (req, res) => {
  res.json({ received: true, note: 'Presence webhook not yet implemented' });
});

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  const cfg = config.load();
  console.log(`\n  Open Hue running at http://localhost:${PORT}`);
  if (cfg.bridgeIp && cfg.username) {
    console.log(`  Bridge: ${cfg.bridgeIp}`);
  } else {
    console.log('  First run — open the UI to set up your Hue Bridge');
  }
  console.log('');
});
