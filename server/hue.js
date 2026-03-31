const fetch = require('node-fetch');

async function discover() {
  const res = await fetch('https://discovery.meethue.com');
  if (!res.ok) throw new Error('Discovery service unavailable');
  const bridges = await res.json();
  return bridges.map(b => ({ id: b.id, ip: b.internalipaddress }));
}

async function register(bridgeIp) {
  const res = await fetch(`http://${bridgeIp}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devicetype: 'home_lights#mac' }),
  });
  const data = await res.json();
  if (data[0]?.error) {
    throw new Error(data[0].error.description || 'Press the link button on your Hue Bridge first');
  }
  if (data[0]?.success?.username) {
    return data[0].success.username;
  }
  throw new Error('Unexpected response from bridge');
}

function bridgeUrl(ip, username) {
  return `http://${ip}/api/${username}`;
}

async function getLights(ip, username) {
  const res = await fetch(`${bridgeUrl(ip, username)}/lights`);
  return res.json();
}

async function setLightState(ip, username, id, state) {
  const res = await fetch(`${bridgeUrl(ip, username)}/lights/${id}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  return res.json();
}

async function setAllLights(ip, username, state) {
  // Group 0 is always "all lights"
  const res = await fetch(`${bridgeUrl(ip, username)}/groups/0/action`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  return res.json();
}

async function getGroups(ip, username) {
  const res = await fetch(`${bridgeUrl(ip, username)}/groups`);
  return res.json();
}

module.exports = { discover, register, getLights, setLightState, setAllLights, getGroups };
