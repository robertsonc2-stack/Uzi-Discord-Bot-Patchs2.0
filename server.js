const http = require("http");
const url = require("url");
const { addLogListener, getLogs, getCommands } = require("./shared.js");
const serverSettings = require("./serverSettings.js");

const PORT = 3000;

// Store connected log clients
let logClients = [];

// Push logs to all connected clients
function sendLogUpdate(entry) {
  logClients.forEach((res) => res.write(`data: ${JSON.stringify(entry)}\n\n`));
}

// Subscribe new logs from shared.js
addLogListener((entry) => {
  sendLogUpdate(entry);
});

// Create the server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // 🔹 Live log stream (SSE)
  if (parsedUrl.pathname === "/logs/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send history when connected
    res.write(`data: ${JSON.stringify({ history: getLogs() })}\n\n`);

    logClients.push(res);

    req.on("close", () => {
      logClients = logClients.filter((c) => c !== res);
    });
    return;
  }

  // 🔹 Dashboard page
  if (parsedUrl.pathname === "/dashboard") {
    const allCommands = getCommands();
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
              ${Object.keys(allCommands)
                .map((cmd) => `<li><b>${cmd}</b>: ${allCommands[cmd]}</li>`)
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

  // 🔹 Commands page
  if (parsedUrl.pathname === "/cmds") {
    const allCommands = getCommands();
    const cmdsList = Object.keys(allCommands)
      .map((cmd) => `<li><b>${cmd}</b>: ${allCommands[cmd]}</li>`)
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
});

module.exports = server;
