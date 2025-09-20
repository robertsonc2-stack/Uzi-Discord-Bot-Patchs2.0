const http = require("http");
const url = require("url");

const PORT = 3000;

// --- Commands ---
const commands = {
  "!help": "Show available commands",
  "!cmds": "List all commands",
  "!dashboard": "Open the bot dashboard",
  "!logs": "Show logs inside dashboard",
};

// --- Logs ---
let logs = [];
let logClients = [];

function addLog(entry) {
  const time = new Date().toLocaleTimeString();
  const msg = `[${time}] ${entry}`;
  logs.push(msg);
  if (logs.length > 100) logs.shift();
  logClients.forEach((res) => res.write(`data: ${JSON.stringify(msg)}\n\n`));
  console.log(msg);
}

// --- Check if port is free ---
const net = require("net");
const tester = net.createServer()
  .once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${PORT} already in use. Server will not start again.`);
    } else {
      console.error(err);
    }
  })
  .once("listening", () => {
    tester.close();

    // --- Create the HTTP server ---
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);

      // SSE logs
      if (parsedUrl.pathname === "/logs/stream") {
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

      // Dashboard
      if (parsedUrl.pathname === "/dashboard") {
        const html = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><title>Dashboard</title></head>
          <body>
            <h1>Bot Dashboard</h1>
            <h2>Commands:</h2>
            <ul>${Object.entries(commands)
              .map(([cmd, desc]) => `<li><b>${cmd}</b>: ${desc}</li>`)
              .join("")}</ul>
            <h2>Logs:</h2>
            <div id="logBox" style="white-space:pre-wrap;"></div>
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
          </body>
          </html>
        `;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
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

      // Default
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Bot Dashboard running at /dashboard");
    });

    server.listen(PORT, () => {
      console.log(`🌐 Server running at http://localhost:${PORT}`);
      addLog(`Server started on port ${PORT}`);
    });

    module.exports = { addLog, commands };
  })
  .listen(PORT);
