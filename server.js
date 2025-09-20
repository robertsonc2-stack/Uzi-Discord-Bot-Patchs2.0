// server.js
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// In-memory server settings
const serverSettings = {};

function getSettings(guildId) {
  return serverSettings[guildId] || { botPrefix: "!", statusMessage: "Uzi is online" };
}
function setSettings(guildId, settings) {
  serverSettings[guildId] = { ...getSettings(guildId), ...settings };
}

module.exports = { getSettings, setSettings };

// Serve static files
function serveFile(res, filePath, contentType, code = 200) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end("Internal Server Error");
      return;
    }
    res.writeHead(code, { "Content-Type": contentType });
    res.end(content, "utf-8");
  });
}

// --- HTTP SERVER ---
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/get-dashboard") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const guildId = params.get("guildId");
      if (!guildId) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Guild ID missing");
        return;
      }

      const settings = getSettings(guildId);

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Server Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; background: #121212; color: #fff; padding: 2rem; }
            h1 { color: #1DB954; }
            .container { max-width: 600px; margin: auto; }
            .section { margin-bottom: 1.5rem; padding: 1rem; background: #1E1E1E; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Server Dashboard</h1>
            <div class="section">
              <h2>Guild ID:</h2>
              <p>${guildId}</p>
            </div>
            <div class="section">
              <h2>Bot Prefix:</h2>
              <p>${settings.botPrefix}</p>
            </div>
            <div class="section">
              <h2>Status Message:</h2>
              <p>${settings.statusMessage}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });
    return;
  }

  // --- GET DASHBOARD PAGE ---
  if (req.method === "GET" && req.url === "/") {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Server Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; background: #121212; color: #fff; padding: 2rem; }
          h1 { color: #1DB954; }
          .container { max-width: 600px; margin: auto; }
          button { padding: 10px 20px; font-size: 16px; background: #1DB954; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
          input { padding: 10px; font-size: 16px; margin-top: 1rem; width: 100%; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Server Dashboard</h1>
          <p>Click the button and enter your Guild ID to view your server settings:</p>
          <input id="guildIdInput" placeholder="Enter your Guild ID" />
          <button onclick="openDashboard()">Open Dashboard</button>

          <script>
            function openDashboard() {
              const guildId = document.getElementById('guildIdInput').value.trim();
              if (!guildId) return alert('Please enter a Guild ID');
              fetch('/get-dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'guildId=' + encodeURIComponent(guildId)
              })
              .then(res => res.text())
              .then(html => {
                document.open();
                document.write(html);
                document.close();
              });
            }
          </script>
        </div>
      </body>
      </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // --- Serve static files if exists ---
  const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".ico": "image/x-icon"
  };
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.exists(filePath, exists => {
    if (exists) serveFile(res, filePath, contentType);
    else serveFile(res, path.join(__dirname, "public", "index.html"), "text/html", 200);
  });
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server running at http://localhost:${PORT}/`);
});

