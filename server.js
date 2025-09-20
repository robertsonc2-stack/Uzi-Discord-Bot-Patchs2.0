// server.js
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 3000;

// Simple in-memory server settings per guild
const serverSettings = {};

// Export functions to access settings
function getSettings(guildId) {
  return serverSettings[guildId] || { botPrefix: "!", statusMessage: "Uzi is online" };
}
function setSettings(guildId, settings) {
  serverSettings[guildId] = { ...getSettings(guildId), ...settings };
}

module.exports = { getSettings, setSettings };

// Helper to serve static files
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
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // --- API ROUTES ---
  if (pathname === "/api/bots") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify([
      { name: "Uzi-Doorman", description: "Roleplays as Uzi Doorman from Murder Drones", prefix: "!", status: "online" },
      { name: "SD-N", description: "Roleplays as SD-N from Murder Drones", prefix: "/", status: "online" },
      { name: "SD-V", description: "Roleplays as SD-V from Murder Drones", prefix: "/", status: "online" }
    ]));
    return;
  }

  if (pathname === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "running",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy" }));
    return;
  }

  // --- Dashboard Page for specific server ---
  if (pathname === "/") {
    const guildId = query.guildId;
    if (guildId) {
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
      return;
    }
  }

  // --- Serve static files if exists ---
  let filePath = path.join(__dirname, "public", pathname === "/" ? "index.html" : pathname);
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

  fs.exists(filePath, (exists) => {
    if (exists) serveFile(res, filePath, contentType);
    else {
      // SPA fallback
      serveFile(res, path.join(__dirname, "public", "index.html"), "text/html", 200);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server running at http://localhost:${PORT}/`);
});
