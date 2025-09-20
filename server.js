// server.js
const http = require("http");
const url = require("url");
const PORT = 3000;

// --- Commands ---
const commands = {
  ping: "Test if bot is alive",
  status: "Show bot status",
  cmds: "Show all commands",
  logs: "View logs (DM only)",
  dashboard: "Open the bot dashboard",
};

// --- Logs storage ---
let logs = [];
let logClients = [];

// --- Authorized user (set via dashboard) ---
let authorizedUserId = null;

// --- Bot settings ---
let botSettings = {
  statusMessage: "Watching everything",
};

// --- Add log ---
function addLog(entry) {
  const time = new Date().toLocaleTimeString();
  const msg = `[${time}] ${entry}`;
  logs.push(msg);
  if (logs.length > 100) logs.shift();

  // Send to dashboard clients
  logClients.forEach((res) => res.write(`data: ${JSON.stringify(msg)}\n\n`));

  console.log(msg);
}

// --- Placeholder for index.js function ---
let updateBotStatusFunction = null;
function setUpdateBotStatus(fn) {
  updateBotStatusFunction = fn;
}

// --- Create server ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // SSE logs stream
  if (parsedUrl.pathname === "/logs/stream") {
    if (!authorizedUserId) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Unauthorized");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(`data: ${JSON.stringify({ history: logs })}\n\n`);
    logClients.push(res);
    req.on("close", () => {
      logClients = logClients.filter((c) => c !== res);
    });
    return;
  }

  // Dashboard page
  if (parsedUrl.pathname === "/dashboard") {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bot Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; background: #1e1e2f; color: #fff; margin: 0; padding: 0; }
        header { background: #2c2c44; padding: 20px; text-align: center; }
        h1 { margin: 0; }
        main { padding: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
        section { background: #2c2c44; padding: 15px; border-radius: 10px; flex: 1; min-width: 300px; }
        button { padding: 10px 15px; margin-top: 10px; background: #3d3d5c; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
        input { padding: 8px; width: 80%; border-radius: 5px; border: none; margin-top: 5px; }
        #logBox { height: 300px; overflow-y: auto; background: #1a1a2f; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <header><h1>Bot Dashboard</h1></header>
      <main>
      ${!authorizedUserId ? `
        <section>
          <h2>Login</h2>
          <p>Enter your Discord User ID to access the dashboard:</p>
          <input type="text" id="userId" placeholder="Your Discord ID"/>
          <button onclick="submitId()">Submit</button>
          <script>
            function submitId() {
              const id = document.getElementById('userId').value;
              fetch('/authorize?id=' + id)
                .then(res => res.text())
                .then(alert)
                .then(() => location.reload());
            }
          </script>
        </section>
      ` : `
        <section>
          <h2>Bot Commands</h2>
          <ul>${Object.entries(commands).map(([cmd, desc]) => `<li><b>${cmd}</b>: ${desc}</li>`).join("")}</ul>
        </section>

        <section>
          <h2>Bot Settings</h2>
          <label>Status Message:</label><br/>
          <input type="text" id="statusMsg" value="${botSettings.statusMessage}" />
          <button onclick="updateStatus()">Update</button>
          <p id="statusUpdateMsg"></p>
          <script>
            function updateStatus() {
              const val = document.getElementById('statusMsg').value;
              fetch('/update-status?msg=' + encodeURIComponent(val))
                .then(res => res.text())
                .then(msg => { document.getElementById('statusUpdateMsg').textContent = msg; });
            }
          </script>
        </section>

        <section>
          <h2>Live Logs</h2>
          <div id="logBox"></div>
          <script>
            const logBox = document.getElementById("logBox");
            const evt = new EventSource("/logs/stream");
            evt.onmessage = e => {
              const data = JSON.parse(e.data);
              if(data.history) data.history.forEach(l => appendLog(l));
              else appendLog(data);
            };
            function appendLog(msg){
              const p=document.createElement("div");
              p.textContent=msg;
              logBox.appendChild(p);
              logBox.scrollTop=logBox.scrollHeight;
            }
          </script>
        </section>
      `}
      </main>
    </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // Authorization endpoint
  if (parsedUrl.pathname === "/authorize") {
    const id = parsedUrl.query.id;
    if (id) {
      authorizedUserId = id;
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("✅ Authorized! Reload the dashboard.");
    } else {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("❌ Missing ID");
    }
    return;
  }

  // Update status endpoint
  if (parsedUrl.pathname === "/update-status") {
    if (!authorizedUserId) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Unauthorized");
      return;
    }
    const msg = parsedUrl.query.msg || "";
    botSettings.statusMessage = msg;
    if (updateBotStatusFunction) updateBotStatusFunction();
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`✅ Status updated to: ${msg}`);
    return;
  }

  // Default response
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot server running. Visit /dashboard for dashboard.");
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  addLog(`Server started on port ${PORT}`);
});

// --- Exports ---
module.exports = {
  addLog,
  commands,
  botSettings,
  setUpdateBotStatus,
  get authorizedUserId() { return authorizedUserId; }
};
