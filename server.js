// server.js
require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const serverSettingsModule = require("./serverSettings.js");

const PORT = 3000;
const MY_USER_ID = "YOUR_USER_ID_HERE"; // Replace with your Discord ID

// Serve files
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
  // --- Dashboard POST ---
  if (req.method === "POST" && req.url === "/get-dashboard") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      const params = querystring.parse(body);
      const guildId = params.guildId;
      const userId = params.userId;

      if (!guildId || !userId) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Guild ID and User ID are required");
        return;
      }

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
        <p>Status Message: <input id="statusMessage" value="${settings.statusMessage}" /></p>
        <button onclick="updateSettings()">Save</button>
        ${accessLink}
        <script>
          function updateSettings() {
            const prefix = document.getElementById('botPrefix').value;
            const status = document.getElementById('statusMessage').value;
            fetch('/update-settings', {
              method:'POST',
              headers:{'Content-Type':'application/x-www-form-urlencoded'},
              body:'guildId=${guildId}&botPrefix='+encodeURIComponent(prefix)+'&statusMessage='+encodeURIComponent(status)
            }).then(res=>res.text()).then(alert).catch(alert);
          }
        </script>
      </body>
      </html>`;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });
    return;
  }

  // --- Update Settings POST ---
  if (req.method === "POST" && req.url === "/update-settings") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      const params = querystring.parse(body);
      const guildId = params.guildId;
      if (!guildId) { res.writeHead(400); res.end("Guild ID missing"); return; }
      serverSettingsModule.setSettings(guildId, { botPrefix: params.botPrefix, statusMessage: params.statusMessage });
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("✅ Settings updated!");
    });
    return;
  }

  // --- Access Control GET ---
  if (req.method === "GET" && req.url.startsWith("/access-control")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userId = parsedUrl.searchParams.get("userId");
    if (userId !== MY_USER_ID) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("❌ Forbidden");
      return;
    }
    const html = `
    <h1>Access Control</h1>
    <input id="guildId" placeholder="Guild ID">
    <input id="userId" placeholder="User ID">
    <button onclick="addUser()">Add User</button>
    <button onclick="removeUser()">Remove User</button>
    <p id="msg"></p>
    <script>
      function addUser(){modify('add');}
      function removeUser(){modify('remove');}
      function modify(action){
        const g = document.getElementById('guildId').value;
        const u = document.getElementById('userId').value;
        fetch('/modify-access?guildId='+g+'&userId='+u+'&action='+action).then(r=>r.text()).then(m=>document.getElementById('msg').innerText=m);
      }
    </script>`;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // --- Modify Access ---
  if (req.method === "GET" && req.url.startsWith("/modify-access")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const guildId = parsedUrl.searchParams.get("guildId");
    const userId = parsedUrl.searchParams.get("userId");
    const action = parsedUrl.searchParams.get("action");
    if (action === "add") serverSettingsModule.addAllowedUser(guildId, userId);
    if (action === "remove") serverSettingsModule.removeAllowedUser(guildId, userId);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`✅ User ${userId} ${action}ed for ${guildId}`);
    return;
  }

  // --- Serve static files ---
  const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const types = { ".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json" };
  fs.exists(filePath, exists => exists ? serveFile(res, filePath, types[ext]||"text/plain") : serveFile(res, path.join(__dirname,"public","index.html"),"text/html"));
});

server.listen(PORT, () => console.log(`🌐 Server running at http://localhost:${PORT}`));
