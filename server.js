// server.js
const http = require("http");
const url = require("url");

const PORT = 3000;

// --- Commands list ---
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

// --- Authorized user (set after dashboard login) ---
let authorizedUserId = null;

// Add log function (index.js can call this)
function addLog(entry) {
  const time = new Date().toLocaleTimeString();
  const msg = `[${time}] ${entry}`;
  logs.push(msg);
  if (logs.length > 100) logs.shift();

  logClients.forEach((res) => res.write(`data: ${JSON.stringify(msg)}\n\n`));
  console.log(msg);
}

// --- Start server ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // SSE logs streaming
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
      <head><meta charset="UTF-8"><title>Bot Dashboard</title></head>
      <body>
        <h1>Bot Dashboard</h1>
        ${!authorizedUserId ? `
          <p>Enter your Discord user ID to access dashboard:</p>
          <input type="text" id="userId" placeholder="Your User ID"/>
          <button onclick="submitId()">Submit</button>
          <script>
            function submitId() {
              const id = document.getElementById('userId').value;
              fetch('/authorize?id=' + id).then(res => res.text()).then(alert).then(() => location.reload());
            }
          </script>
        ` : `
          <h2>Commands:</h2>
          <ul>${Object.entries(commands)
            .map(([cmd, desc]) => `<li><b>${cmd}</b>: ${desc}</li>`)
            .join("")}</ul>
          <h2>Logs:</h2>
          <div id="logBox" style="white-space:pre-wrap;height:300px;overflow:auto;border:1px solid #ccc;padding:5px;"></div>
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
        `}
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

  // Commands page
  if (parsedUrl.pathname === "/cmds") {
    const html = `<ul>${Object.entries(commands)
      .map(([cmd, desc]) => `<li><b>${cmd}</b>: ${desc}</li>`)
      .join("")}</ul>`;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // Default page
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot server running. Visit /dashboard for dashboard.");
});

server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  addLog(`Server started on port ${PORT}`);
});

module.exports = { addLog, commands };
