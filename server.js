const http = require("http");
const fs = require("fs");
const path = require("path");

let updateBotStatusCallback = null;
let logs = [];

const DASHBOARD_PASSWORD = "secret77";
const SECRET_PASSWORD = "owner77";

// Register a bot status updater from index.js
function setUpdateBotStatus(callback) {
  updateBotStatusCallback = callback;
}

// Trigger the bot status update
function triggerUpdateBotStatus(newStatus) {
  if (updateBotStatusCallback) updateBotStatusCallback(newStatus);
}

// Add a log entry
function addLog(message) {
  const timestamp = new Date().toLocaleString();
  logs.push(`[${timestamp}] ${message}`);
}

// Return all logs
function getLogs() {
  return logs;
}

// HTTP server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const password = url.searchParams.get("password");
  let filePath = "." + url.pathname;

  if (filePath === "./") filePath = "./dashboard.html";

  // Dashboard password check
  if (filePath.endsWith("dashboard.html")) {
    if (password !== DASHBOARD_PASSWORD) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Dashboard Password");
      return;
    }
  }

  // Secret page password check
  if (filePath.endsWith("secret.html") || filePath.startsWith("./logs")) {
    if (password !== SECRET_PASSWORD) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Secret Page Password");
      return;
    }
  }

  // Change bot status endpoint
  if (url.pathname === "/change-status") {
    if (password !== DASHBOARD_PASSWORD) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Password");
      return;
    }
    const newStatus = url.searchParams.get("status") || "Online";
    triggerUpdateBotStatus(newStatus);
    addLog(`Bot status changed to: ${newStatus}`);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Status updated successfully");
    return;
  }

  // Logs API endpoint
  if (url.pathname === "/logs") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getLogs()));
    return;
  }

  // Serve static files
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
  };
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Export functions for index.js
module.exports = {
  setUpdateBotStatus,
  triggerUpdateBotStatus,
  addLog,
  getLogs
};

