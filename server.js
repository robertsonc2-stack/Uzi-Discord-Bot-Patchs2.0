// server.js
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const PORT = 3000;
const MY_USER_ID = "YOUR_USER_ID_HERE"; // <-- Replace with your Discord ID

// --- In-memory storage ---
const serverSettings = {}; // { guildId: { botPrefix, statusMessage } }
const accessControl = {};  // { guildId: [userId1, userId2, ...] }

// --- Helper functions ---
function getSettings(guildId) {
  return serverSettings[guildId] || { botPrefix: "!", statusMessage: "Uzi is online" };
}
function setSettings(guildId, settings) {
  serverSettings[guildId] = { ...getSettings(guildId), ...settings };
}
function getAllowedUsers(guildId) {
  return accessControl[guildId] || [];
}
function addAllowedUser(guildId, userId) {
  if (!accessControl[guildId]) accessControl[guildId] = [];
  if (!accessControl[guildId].includes(userId)) accessControl[guildId].push(userId);
}
function removeAllowedUser(guildId, userId) {
  if (!accessControl[guildId]) return;
  accessControl[guildId] = accessControl[guildId].filter(id => id !== userId);
}

// --- Serve static files ---
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

// --- HTTP Server ---
const server = http.createServer((req, res) => {
  // --- POST: Dashboard ---
  if (req.method === "POST" && req.url === "/get-dashboard") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      const params = querystring.parse(body);
      const guildId = params.guildId;
      const userId = params.userId;

      if (!guildId || !userId) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Guild ID and User ID are required");
        return;
      }

      // Check access
      if (!getAllowedUsers(guildId).includes(userId)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("❌ You do not have permission to edit this server's settings");
        return;
      }

      const settings = getSettings(guildId);
      const accessControlLink = userId === MY_USER_ID
        ? `<p><a href="/access-control" style="color:#1DB954;">Manage Allowed Users</a></p>`
        : "";

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
            input, button { padding: 10px; font-size: 16px; margin-top: 0.5rem; width: 100%; }
            button { cursor: pointer; background: #1DB954; color: #fff; border: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Server Dashboard</h1>
            <div class="section"><h2>Guild ID:</h2><p>${guildId}</p></div>
            <div class="section"><h2>User ID:</h2><p>${userId}</p></div>
            <div class="section">
              <h2>Bot Prefix:</h2>
              <input id="botPrefix" value="${settings.botPrefix}" />
            </div>
            <div class="section">
              <h2>Status Message:</h2>
              <input id="statusMessage" value="${settings.statusMessage}" />
              <button onclick="updateSettings()">Save Settings</button>
            </div>
            ${accessControlLink}
          </div>
          <script>
            function updateSettings() {
              const prefix = document.getElementById('botPrefix').value;
              const status = document.getElementById('statusMessage').value;
              fetch('/update-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'guildId=${guildId}&botPrefix=' + encodeURIComponent(prefix) + '&statusMessage=' + encodeURIComponent(status)
              })
              .then(res => res.text())
              .then(msg => alert(msg))
              .catch(err => alert('Error: ' + err));
            }
          </script>
        </body>
        </html>
      `;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });
    return;
  }

  // --- POST: Update settings ---
  if (req.method === "POST" && req.url === "/update-settings") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      const params = querystring.parse(body);
      const guildId = params.guildId;
      if (!guildId) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Guild ID missing");
        return;
      }
      setSettings(guildId, { botPrefix: params.botPrefix, statusMessage: params.statusMessage });
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("✅ Settings updated successfully!");
    });
    return;
  }

  // --- GET: Access Control (Admin Only) ---
  if (req.method === "GET" && req.url.startsWith("/access-control")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userId = parsedUrl.searchParams.get("userId");
    if (userId !== MY_USER_ID) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("❌ You do not have permission to access this page");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Access Control</title>
        <style>
          body { font-family: Arial, sans-serif; background: #121212; color: #fff; padding: 2rem; }
          h1 { color: #1DB954; }
          .container { max-width: 600px; margin: auto; }
          input, button { padding: 10px; font-size: 16px; margin-top: 0.5rem; width: 100%; }
          button { cursor: pointer; background: #1DB954; color: #fff; border: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Access Control (Admin Only)</h1>
          <p>Add or remove a user ID to allow editing server settings:</p>
          <input id="guildIdInput" placeholder="Enter Guild ID" />
          <input id="userIdInput" placeholder="Enter User ID to allow" />
          <button onclick="addUser()">Add User</button>
          <button onclick="removeUser()">Remove User</button>
          <p id="message"></p>
          <script>
            function addUser() {
              const guildId = document.getElementById('guildIdInput').value.trim();
              const userId = document.getElementById('userIdInput').value.trim();
              if (!guildId || !userId) return alert('Enter both Guild ID and User ID');
              fetch('/modify-access?guildId=' + encodeURIComponent(guildId) + '&userId=' + encodeURIComponent(userId) + '&action=add')
                .then(res => res.text()).then(msg => document.getElementById('message').innerText = msg);
            }
            function removeUser() {
              const guildId = document.getElementById('guildIdInput').value.trim();
              const userId = document.getElementById('userIdInput').value.trim();
              if (!guildId || !userId) return alert('Enter both Guild ID and User ID');
              fetch('/modify-access?guildId=' + encodeURIComponent(guildId) + '&userId=' + encodeURIComponent(userId) + '&action=remove')
                .then(res => res.text()).then(msg => document.getElementById('message').innerText = msg);
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

  // --- GET: Modify access ---
  if (req.method === "GET" && req.url.startsWith("/modify-access")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const guildId = parsedUrl.searchParams.get("guildId");
    const userId = parsedUrl.searchParams.get("userId");
    const action = parsedUrl.searchParams.get("action");

    if (!guildId || !userId || !action) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing parameters");
      return;
    }
    if (action === "add") addAllowedUser(guildId, userId);
    if (action === "remove") removeAllowedUser(guildId, userId);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`✅ User ${userId} ${action === "add" ? "added" : "removed"} for Guild ${guildId}`);
    return;
  }

  // --- Serve main login page or static files ---
  if (req.method === "GET") {
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
    return;
  }
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🌐 HTTP server running at http://localhost:${PORT}/`);
});
