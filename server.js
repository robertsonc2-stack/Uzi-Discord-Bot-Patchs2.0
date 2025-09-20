// server.js
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const serverSettingsModule = require("./serverSettings.js");

const PORT = 3000;
const MY_USER_ID = "YOUR_USER_ID_HERE"; // Replace with your Discord ID

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

const server = http.createServer((req, res) => {
  // --- Serve main dashboard page ---
  if (req.method === "GET" && req.url === "/") {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Bot Dashboard</title></head>
    <body>
      <h1>Bot Dashboard</h1>
      <form id="accessForm">
        <label>Your User ID: <input id="userId" placeholder="Discord User ID"></label><br>
        <label>Your Guild ID: <input id="guildId" placeholder="Discord Guild ID"></label><br>
        <button type="button" onclick="goDashboard()">Go to Dashboard</button>
      </form>
      <script>
        // Auto-fill your user ID
        document.getElementById('userId').value = '${MY_USER_ID}';
        function goDashboard() {
          const guildId = document.getElementById('guildId').value;
          const userId = document.getElementById('userId').value;
          if(!guildId || !userId){alert('Fill both fields');return;}
          window.location.href = '/dashboard?guildId='+guildId+'&userId='+userId;
        }
      </script>
    </body>
    </html>`;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // --- Dashboard page ---
  if (req.method === "GET" && req.url.startsWith("/dashboard")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userId = parsedUrl.searchParams.get("userId");
    const guildId = parsedUrl.searchParams.get("guildId");

    if (!userId || !guildId) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Guild ID and User ID are required");
      return;
    }

    // Access check
    if (!serverSettingsModule.getAllowedUsers(guildId).includes(userId)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("❌ You do not have permission");
      return;
    }

    const settings = serverSettingsModule.getSettings(guildId);
    const accessLink = userId === MY_USER_ID
      ? `<p><a href="/access-control" style="color:#1DB954;">Manage Allowed Users</a></p>` : "";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Dashboard</title></head>
    <body>
      <h1>Server Dashboard</h1>
      <p>Guild ID: ${guildId}</p>
      <p>User ID: ${userId}</p>
      <p>Bot Prefix: <input id="botPrefix" value="${settings.botPrefix}" /></p>
      <p>Status Message: <input id="statusMessage" val
