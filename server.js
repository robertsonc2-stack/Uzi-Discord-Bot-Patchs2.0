const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// --- Bot settings & logs ---
const botSettings = {
  prefix: "!",
  statusMessage: "Watching everything",
};

let logs = [];
function addLog(msg) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${msg}`;
  logs.push(logEntry);
  console.log(logEntry);
}

// --- Authorized user ---
let authorizedUserId = null; // set in dashboard after password login

// --- Update bot status callback ---
let updateBotStatusCallback = () => {};
function setUpdateBotStatus(cb) {
  updateBotStatusCallback = cb;
}

// --- HTML pages ---
function serveFile(filePath, res, contentType = "text/html") {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Error loading page");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// --- Server ---
const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    if (req.url === "/" || req.url === "/dashboard") {
      return serveFile(path.join(__dirname, "public", "dashboard.html"), res);
    }

    if (req.url === "/secret") {
      // Secret password page
      return serveFile(path.join(__dirname, "public", "secret.html"), res);
    }

    if (req.url === "/api/logs") {
      // Only return logs if authorized
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(logs));
    }

    if (req.url === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(botSettings));
    }

    res.writeHead(404);
    return res.end("Not Found");
  }

  if (req.method === "POST") {
    if (req.url === "/api/password") {
      // Simple password check
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const data = new URLSearchParams(body);
        const password = data.get("password");
        if (password === "coltonsr77") {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true }));
        }
        res.writeHead(401);
        return res.end(JSON.stringify({ success: false }));
      });
      return;
    }

    if (req.url === "/api/set-status") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const data = JSON.parse(body);
        if (!data.statusMessage) return res.end("Missing status");
        botSettings.statusMessage = data.statusMessage;
        updateBotStatusCallback(); // trigger bot status update
        res.end(JSON.stringify({ success: true }));
      });
      return;
    }
  }

  res.writeHead(404);
  res.end("Not Found");
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  addLog(`Server started on port ${PORT}`);
});

// --- Exports ---
module.exports = {
  botSettings,
  logs,
  addLog,
  authorizedUserId,
  setUpdateBotStatus,
};
