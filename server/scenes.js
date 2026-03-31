const fs = require('fs');
const path = require('path');
const os = require('os');

const SCENES_FILE = path.join(os.homedir(), '.home-lights', 'scenes.json');

const DEFAULT_SCENES = {
  Night:    { state: { on: true, bri: 25,  hue: 0,     sat: 254, transitiontime: 10 } },
  Evening:  { state: { on: true, bri: 102, ct: 400,    transitiontime: 10 } },
  Morning:  { state: { on: true, bri: 178, ct: 350,    transitiontime: 10 } },
  Full:     { state: { on: true, bri: 254, ct: 250,    transitiontime: 5 } },
  Movie:    { state: { on: true, bri: 51,  ct: 300,    transitiontime: 10 } },
  Off:      { state: { on: false, transitiontime: 10 } },
};

function loadCustom() {
  try {
    if (fs.existsSync(SCENES_FILE)) {
      return JSON.parse(fs.readFileSync(SCENES_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveCustom(scenes) {
  const dir = path.dirname(SCENES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SCENES_FILE, JSON.stringify(scenes, null, 2));
}

function list() {
  const custom = loadCustom();
  return { ...DEFAULT_SCENES, ...custom };
}

function get(name) {
  const all = list();
  return all[name] || null;
}

function save(name, state) {
  const custom = loadCustom();
  custom[name] = { state, custom: true };
  saveCustom(custom);
}

module.exports = { list, get, save };
