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
let authorizedDashboard = false;
let authorizedSecret = false;

// --- Update bot status callback ---
let updateBotStatusCallback = () => {};
function setUpdateBotStatus(cb) {
  updateBotStatusCallback = cb;
}

// --- HTML helper ---
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
      if (!authorizedSecret) {
        res.writeHead(401);
        return res.end("Unauthorized: enter the correct password on dashboard");
      }
      return serveFile(path.join(__dirname, "public", "secret.html"), res);
    }

    if (req.url === "/api/logs") {
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
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      // Dashboard password
      if (req.url === "/api/dashboard-password") {
        const data = new URLSearchParams(body);
        if (data.get("password") === "key77") {
          authorizedDashboard = true;
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true }));
        }
        res.writeHead(401);
        return res.end(JSON.stringify({ success: false }));
      }

      // Secret password
      if (req.url === "/api/secret-password") {
        const data = new URLSearchParams(body);
        if (data.get("password") === "coltonsr77") {
          authorizedSecret = true;
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true }));
        }
        res.writeHead(401);
        return res.end(JSON.stringify({ success: false }));
      }

      // Update status
      if (req.url === "/api/set-status") {
        const data = JSON.parse(body);
        if (!data.statusMessage) return res.end("Missing status");
        botSettings.statusMessage = data.statusMessage;
        updateBotStatusCallback();
        return res.end(JSON.stringify({ success: true }));
      }
    });
    return;
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
  setUpdateBotStatus,
};
