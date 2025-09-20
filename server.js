const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Load existing settings from file or create empty object
let allServerSettings = {};
const settingsFile = path.join(__dirname, 'server-settings.json');
if (fs.existsSync(settingsFile)) {
  allServerSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
}

// Helper to serve HTML page
function serveSettingsPage(res, guildId) {
  const settings = allServerSettings[guildId] || {
    botPrefix: '!',
    statusMessage: 'Uzi is online',
    maxRestarts: 2
  };

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Server Settings</title>
    <style>
      body { font-family: Arial; background: #222; color: #eee; padding: 20px; }
      h1 { color: #f39c12; }
      label { display: block; margin: 10px 0 5px; }
      input, button { padding: 5px; margin-bottom: 10px; width: 300px; }
      button { cursor: pointer; background: #f39c12; border: none; color: #222; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>Settings for Server: ${guildId}</h1>
    <form method="POST" action="/update-settings">
      <input type="hidden" name="guildId" value="${guildId}" />
      <label>Bot Prefix:</label>
      <input type="text" name="botPrefix" value="${settings.botPrefix}" />
      <label>Status Message:</label>
      <input type="text" name="statusMessage" value="${settings.statusMessage}" />
      <label>Max Restarts:</label>
      <input type="number" name="maxRestarts" value="${settings.maxRestarts}" />
      <br/>
      <button type="submit">Save Settings</button>
    </form>
  </body>
  </html>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

// Parse POST data
function parsePostData(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    const data = {};
    body.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      data[decodeURIComponent(key)] = decodeURIComponent((value || '').replace(/\+/g, ' '));
    });
    callback(data);
  });
}

// HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    // Require ?guildId=<id> query
    const url = new URL(req.url, `http://${req.headers.host}`);
    const guildId = url.searchParams.get('guildId');
    if (!guildId) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('❌ Missing guildId parameter in URL. Example: /?guildId=YOUR_SERVER_ID');
    }
    return serveSettingsPage(res, guildId);
  }

  if (req.method === 'POST' && req.url === '/update-settings') {
    parsePostData(req, data => {
      const guildId = data.guildId;
      if (!guildId) return res.end('❌ Missing guildId');

      allServerSettings[guildId] = {
        botPrefix: data.botPrefix || '!',
        statusMessage: data.statusMessage || 'Uzi is online',
        maxRestarts: parseInt(data.maxRestarts) || 2
      };

      fs.writeFileSync(settingsFile, JSON.stringify(allServerSettings, null, 2));

      res.writeHead(302, { Location: `/?guildId=${guildId}` });
      res.end();
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => console.log(`⚡ Server running on port ${PORT}`));

module.exports = {
  getSettings: (guildId) => allServerSettings[guildId] || null
};
