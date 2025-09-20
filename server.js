const http = require("http");
const url = require("url");

const PORT = 3000;

// 🔹 Command list (add all your commands here)
const commands = {
  "!help": "Show available commands",
  "!cmds": "List all commands",
  "!dashboard": "Open the bot dashboard",
  "!logs": "Show logs inside Discord",
  "!dashboardlogs": "Show logs inside dashboard",
};

// 🔹 Logs
let logs = [];
let logClients = [];

function addLog(entry) {
  const time = new Date().toLocaleTimeString();
  const msg = `[${time}] ${entry}`;
  logs.push(msg);

  // Keep logs short (last 100)
  if (logs.length > 100) logs.shift();

  // Push to all SSE clients
  logClients.forEach((res) => res.write(`data: ${JSON.stringify(msg)}\n\n`));
  console.log(msg); // also print in console
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // 🔹 Live logs stream (SSE)
  if (parsedUrl.pathname === "/logs/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send history
    res.write(`data: ${JSON.stringify({ history: logs })}\n\n`);

    logClients.push(res);

    req.on("close", () => {
      logClients = logClients.filter((c) => c !== res);
    });
    return;
  }

  // 🔹 Dashboard page
  if (parsedUrl.pathname === "/dashboard") {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Bot Dashboard</title>
        <style>
          body { background:#12121c; color:#f5f5f5; font-family:Arial, sans-serif; margin:0; padding:0; }
          header { background:#1f1f2e; padding:15px; text-align:center; font-size:22px; }
          .container { display:flex; gap:20px; padding:20px; }
          .card { background:#1c1c29; padding:15px; border-radius:8px; flex:1; }
          h2 { margin-top:0; }
          ul { padding-left:20px; }
          #logBox { background:#111118; padding:10px; border-radius:8px; height:400px; overflow-y:scroll; font-family:monospace; }
        </style>
      </head>
      <body>
        <header>⚙️ Bot Dashboard</header>
        <div class="container">
          <div class="card">
            <h2>📜 Commands</h2>
            <ul>
              ${Object.entries(commands)
                .map(([cmd, desc]) => `<li><b>${cmd}</b>: ${desc}</li>`)
                .join("")}
            </ul>
          </div>
          <div class="card">
            <h2>📖 Live Logs</h2>
            <div id="logBox"></div>
          </div>
        </div>

        <script>
          const logBox = document.getElementById("logBox");
          const evtSource = new EventSource("/logs/stream");
          evtSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.history) {
              data.history.forEach(e => appendLog(e));
            } else {
              appendLog(data);
            }
          };
          function appendLog(msg) {
            const p = document.createElement("div");
            p.textContent = msg;
            logBox.appendChild(p);
            logBox.scrollTop = logBox.scrollHeight;
          }
        </script>
      </body>
      </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // 🔹 Commands list page
  if (parsedUrl.pathname === "/cmds") {
    const cmdsList = Object.entries(commands)
      .map(([cmd, desc]) => `<li><b>${cmd}</b>: ${desc}</li>`)
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Commands</title></head>
      <body style="background:#12121c;color:#f5f5f5;font-family:Arial;padding:20px;">
        <h1>📜 Command List</h1>
        <ul>${cmdsList}</ul>
      </body>
      </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // 🔹 Default response
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot Dashboard is running. Go to /dashboard or /cmds");
});

// Start server
server.listen(PORT, () => {
  console.log(`🌐 Web dashboard running at http://localhost:${PORT}`);
  addLog("Dashboard started at http://localhost:3000");
});

// Export so index.js can use logs
module.exports = { addLog, commands };
