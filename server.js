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

// --- Authorized user ---
let authorizedUserId = null;

// --- Bot settings ---
let botSettings = {
  statusMessage: "Watching everything",
  prefix: "!",
};

// --- Secret page password ---
let dashboardPassword = "mypassword123"; // change this to your password

// --- Add log ---
function addLog(entry) {
  const time = new Date().toLocaleTimeString();
  const msg = `[${time}] ${entry}`;
  logs.push(msg);
  if (logs.length > 100) logs.shift();

  logClients.forEach((res) => res.write(`data: ${JSON.stringify(msg)}\n\n`));
  console.log(msg);
}

// --- Placeholder for index.js status updater ---
let updateBotStatusFunction = null;
function setUpdateBotStatus(fn) {
  updateBotStatusFunction = fn;
}

// --- Create server ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // --- Logs SSE ---
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

  // --- Dashboard page ---
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
      <header>
        <h1>Bot Dashboard</h1>
        <p>Bot Prefix: <b>${botSettings.prefix}</b></p>
      </header>
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
          <h2>Bot Settings</h2>
          <label>Status Message:</label><br/>
          <input type="text" id="statusMsg" value="${botSettings.statusMessage}" />
          <button onclick="updateStatus()">Change Status</button>
          <p id="statusUpdateMsg"></p>
          <br/><br/>
          <label>Bot Prefix:</label><br/>
          <input type="text" id="botPrefix" value="${botSettings.prefix}" maxlength="3"/>
          <button onclick="updatePrefix()">Change Prefix</button>
          <p id="prefixUpdateMsg"></p>

          <script>
            function updateStatus() {
              const val = document.getElementById('statusMsg').value;
              fetch('/update-status?msg=' + encodeURIComponent(val))
                .then(res => res.text())
                .then(msg => { document.getElementById('statusUpdateMsg').textContent = msg; });
            }

            function updatePrefix() {
              const val = document.getElementById('botPrefix').value;
              fetch('/update-prefix?prefix=' + encodeURIComponent(val))
                .then(res => res.text())
                .then(msg => { document.getElementById('prefixUpdateMsg').textContent = msg; });
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

        <section>
          <h2>Secret Page Access</h2>
          <input type="password" id="secretPw" placeholder="Enter password"/>
          <button onclick="goToSecret()">Go to Secret Page</button>

          <script>
            function goToSecret() {
              const pw = document.getElementById('secretPw').value;
              window.location.href = '/secret-page?pw=' + encodeURIComponent(pw);
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

  // --- Authorization endpoint ---
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

  // --- Update status ---
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

  // --- Update prefix ---
  if (parsedUrl.pathname === "/update-prefix") {
    if (!authorizedUserId) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Unauthorized");
      return;
    }
    const prefix = parsedUrl.query.prefix || "!";
    botSettings.prefix = prefix;
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`✅ Prefix updated to: ${prefix}`);
    return;
  }

  // --- Secret page ---
  if (parsedUrl.pathname === "/secret-page") {
    const password = parsedUrl.query.pw;
    if (!authorizedUserId || password !== dashboardPassword) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("❌ Unauthorized: Wrong password or not logged in.");
      return;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Secret Page</title>
      <style>
        body { font-family: Arial, sans-serif; background: #1e1e2f; color: #fff; text-align: center; padding: 50px; }
        button { padding: 10px 15px; margin-top: 20px; background: #3d3d5c; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>🔒 Secret Page</h1>
      <p>Only accessible with the correct password!</p>
      <button onclick="window.location.href='/dashboard'">Back to Dashboard</button>
    </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // --- Default response ---
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
  get authorizedUserId() { return authorizedUserId; },
};

