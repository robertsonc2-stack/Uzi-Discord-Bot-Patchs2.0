// server.js
require("dotenv").config();
const http = require("http");
const querystring = require("querystring");
const serverSettingsModule = require("./serverSettings.js");
const { getCommands } = require("./commandsRegistry.js");

const PORT = 3000;
const MY_USER_ID = "YOUR_USER_ID_HERE"; // replace with your Discord ID

const server = http.createServer((req, res) => {
  // --- Dashboard redirect from root ---
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(302, { Location: "/dashboard" });
    return res.end();
  }

  // --- Dashboard page ---
  if (req.method === "GET" && req.url.startsWith("/dashboard")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userId = parsedUrl.searchParams.get("userId") || MY_USER_ID;
    const guildId = parsedUrl.searchParams.get("guildId") || "";

    const settings = guildId ? serverSettingsModule.getSettings(guildId) : { botPrefix: "!", statusMessage: "No Status" };
    const isOwner = userId === MY_USER_ID;
    const readonly = isOwner ? "" : "readonly";

    const allCommands = Object.entries(getCommands())
      .map(([cmd, info]) => `<li><b>${cmd}</b>: ${info.description}</li>`).join("");

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Bot Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; background: #1e1e2f; color: #fff; padding: 20px; }
        h1 { color: #00ffd5; }
        input { padding: 5px; margin: 5px 0; }
        button { padding: 8px 15px; background: #00ffd5; border: none; cursor: pointer; color: #000; margin-top: 5px; }
        button:hover { background: #00c2a5; }
        ul { list-style-type: none; padding-left: 0; }
        li { margin: 5px 0; }
        .readonly { background: #555; }
      </style>
    </head>
    <body>
      <h1>Server Dashboard</h1>
      <p><b>Guild ID:</b> ${guildId}</p>
      <p><b>User ID:</b> ${userId}</p>

      <h2>Bot Settings</h2>
      <label>Bot Prefix: <input id="botPrefix" value="${settings.botPrefix}" ${readonly} class="${readonly ? 'readonly':''}" /></label><br>
      <label>Status Message: <input id="statusMessage" value="${settings.statusMessage}" ${readonly} class="${readonly ? 'readonly':''}" /></label><br>
      ${isOwner ? '<button onclick="updateSettings()">Save Settings</button>' : '<p>🔒 You cannot edit these settings</p>'}

      <h2>Available Commands</h2>
      <ul>${allCommands}</ul>

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
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // --- Update settings ---
  if (req.method === "POST" && req.url === "/update-settings") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      const params = querystring.parse(body);
      if (params.userId !== MY_USER_ID) { 
        res.writeHead(403, { "Content-Type": "text/plain" });
        return res.end("❌ Only the owner can update settings");
      }
      if (!params.guildId) { res.writeHead(400); return res.end("Guild ID missing"); }
      serverSettingsModule.setSettings(params.guildId, { botPrefix: params.botPrefix, statusMessage: params.statusMessage });
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("✅ Settings updated!");
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, () => console.log(`🌐 Server running at http://localhost:${PORT}`));
