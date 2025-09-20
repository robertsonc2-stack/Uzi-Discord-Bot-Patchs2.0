// server.js
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const serverSettingsModule = require("./serverSettings.js");
const { commands } = require("./index.js"); // import commands directly

const PORT = 3000;
const MY_USER_ID = "YOUR_USER_ID_HERE"; // Replace with your Discord ID

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

  if (req.method === "GET" && req.url.startsWith("/dashboard")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userId = parsedUrl.searchParams.get("userId");
    const guildId = parsedUrl.searchParams.get("guildId");

    if (!userId || !guildId) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Guild ID and User ID are required");
      return;
    }

    const settings = serverSettingsModule.getSettings(guildId);
    const isOwner = userId === MY_USER_ID;
    const readonly = isOwner ? "" : "readonly";

    // Get all commands dynamically from index.js
    const allCommands = Object.entries(commands)
      .map(([cmd, info]) => `<li><b>${cmd}</b>: ${info.description}</li>`).join("");

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Dashboard</title></head>
    <body>
      <h1>Server Dashboard</h1>
      <p>Guild ID: ${guildId}</p>
      <p>User ID: ${userId}</p>

      <h2>Bot Settings</h2>
      <p>Bot Prefix: <input id="botPrefix" value="${settings.botPrefix}" ${readonly} /></p>
      <p>Status Message: <input id="statusMessage" value="${settings.statusMessage}" ${readonly} /></p>
      ${isOwner ? '<button onclick="updateSettings()">Save</button>' : '<p>🔒 You cannot edit these settings</p>'}

      <h2>Available Commands</h2>
      <ul>
        ${allCommands}
      </ul>

      <script>
        function updateSettings() {
          const prefix = document.getElementById('botPrefix').value;
          const status = document.getElementById('statusMessage').value;
          fetch('/update-settings', {
            method:'POST',
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            body:'guildId=${guildId}&botPrefix='+encodeURIComponent(prefix)+'&statusMessage='+encodeURIComponent(status)+'&userId=${userId}'
          }).then(res=>res.text()).then(alert).catch(alert);
        }
      </script>
    </body>
    </html>`;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/update-settings") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      const params = querystring.parse(body);
      const guildId = params.guildId;
      const userId = params.userId || "";
      if (userId !== MY_USER_ID) { 
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("❌ Only the owner can update settings");
        return;
      }
      if (!guildId) { res.writeHead(400); res.end("Guild ID missing"); return; }
      serverSettingsModule.setSettings(guildId, { botPrefix: params.botPrefix, statusMessage: params.statusMessage });
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("✅ Settings updated!");
    });
    return;
  }

  // Serve static fallback
  const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const types = { ".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json" };
  fs.exists(filePath, exists => exists ? serveFile(res, filePath, types[ext]||"text/plain") : serveFile(res, path.join(__dirname,"public","index.html"),"text/html"));
});

server.listen(PORT, () => console.log(`🌐 Server running at http://localhost:${PORT}`));

