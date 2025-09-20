const http = require("http");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");
const path = require("path");
const serverSettings = require("./serverSettings.js");
const { getCommands, addLogListener, getLogs } = require("./shared.js");

const PORT = 3000;
const MY_USER_ID = "123456789012345678"; // 🔑 Replace with your Discord user ID

let clients = []; // EventStream connections

// --- Dashboard Page ---
function dashboardPage(userId, guildId) {
  const settings = guildId ? serverSettings.getSettings(guildId) : { botPrefix: "!", statusMessage: "No Status" };
  const isOwner = userId === MY_USER_ID;
  const readonly = isOwner ? "" : "readonly";

  const allCommands = Object.entries(getCommands())
    .map(([cmd, info]) => `<li><span class="cmd">/${cmd}</span> — ${info.description}</li>`)
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Bot Dashboard</title>
    <style>
      body { font-family: Arial, sans-serif; background: #12121c; color: #f5f5f5; margin: 0; padding: 0; }
      header { background: #1f1f2e; padding: 15px; text-align: center; color: #00ffd5; font-size: 1.5em; }
      main { padding: 20px; display: grid; gap: 20px; max-width: 900px; margin: auto; }
      .card { background: #1c1c29; padding: 20px; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
      h2 { color: #00ffd5; margin-top: 0; }
      input { padding: 8px; margin: 6px 0; width: 100%; border: none; border-radius: 6px; background: #2b2b3d; color: #fff; }
      input.readonly { background: #444; }
      button { padding: 10px 18px; background: #00ffd5; border: none; border-radius: 8px; color: #000; cursor: pointer; font-weight: bold; margin-top: 10px; }
      button:hover { background: #00c2a5; }
      ul { list-style-type: none; padding-left: 0; margin: 0; }
      li { margin: 6px 0; padding: 6px; background: #222233; border-radius: 6px; }
      .cmd { color: #00ffd5; font-weight: bold; }
      footer { text-align: center; padding: 15px; font-size: 0.9em; color: #aaa; }
      .log-box { background: #0f0f1a; padding: 10px; height: 200px; overflow-y: auto; border-radius: 8px; font-family: monospace; font-size: 0.9em; }
    </style>
  </head>
  <body>
    <header>🤖 Bot Dashboard</header>
    <main>
      <div class="card">
        <h2>⚙️ Bot Settings</h2>
        <p><b>Guild ID:</b> ${guildId || "N/A"}</p>
        <p><b>User ID:</b> ${userId}</p>
        <label>Bot Prefix:</label>
        <input id="botPrefix" value="${settings.botPrefix}" ${readonly} class="${readonly ? 'readonly':''}" />
        <label>Status Message:</label>
        <input id="statusMessage" value="${settings.statusMessage}" ${readonly} class="${readonly ? 'readonly':''}" />
        ${isOwner ? '<button onclick="updateSettings()">💾 Save Settings</button>' : '<p>🔒 Read-only view</p>'}
      </div>

      <div class="card">
        <h2>📜 Available Commands</h2>
        <ul>${allCommands}</ul>
      </div>

      <div class="card">
        <h2>📝 Live Logs</h2>
        <div id="logs" class="log-box"></div>
      </div>
    </main>
    <footer>Made with ❤️ for Discord</footer>

    <script>
      const evtSource = new EventSource('/events');

      evtSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if(data.type === "settings" && data.guildId === "${guildId}") {
          document.getElementById('botPrefix').value = data.botPrefix;
          document.getElementById('statusMessage').value = data.statusMessage;
        }

        if(data.type === "log") {
          const logBox = document.getElementById("logs");
          const entry = document.createElement("div");
          entry.textContent = data.message;
          logBox.appendChild(entry);
          logBox.scrollTop = logBox.scrollHeight;
        }
      };

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
}

// --- HTTP Server ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Dashboard page
  if (req.method === "GET" && req.url.startsWith("/dashboard")) {
    const userId = parsedUrl.query.userId || MY_USER_ID;
    const guildId = parsedUrl.query.guildId || "";
    const html = dashboardPage(userId, guildId);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // EventStream for live updates
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("\n");
    clients.push(res);

    // Push existing logs immediately
    getLogs().forEach(log => {
      res.write(`data: ${JSON.stringify({ type: "log", message: log })}\n\n`);
    });

    req.on("close", () => {
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  // Update settings
  if (req.method === "POST" && req.url === "/update-settings") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      const data = querystring.parse(body);
      if (data.userId === MY_USER_ID) {
        serverSettings.updateSettings(data.guildId, {
          botPrefix: data.botPrefix,
          statusMessage: data.statusMessage,
        });

        clients.forEach(c =>
          c.write(`data: ${JSON.stringify({ type: "settings", guildId: data.guildId, botPrefix: data.botPrefix, statusMessage: data.statusMessage })}\n\n`)
        );

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("✅ Settings updated");
      } else {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("❌ Not authorized");
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

// --- Broadcast logs from bot to dashboard ---
addLogListener((msg) => {
  clients.forEach(c => c.write(`data: ${JSON.stringify({ type: "log", message: msg })}\n\n`));
});

server.listen(PORT, () => {
  console.log(`🌐 Web dashboard running at http://localhost:${PORT}/dashboard`);
});
