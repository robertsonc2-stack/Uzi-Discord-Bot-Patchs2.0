const http = require("http");
const fs = require("fs");
const path = require("path");

let updateBotStatusCallback = null;
let logs = [];

// Register a bot status updater from index.js
function setUpdateBotStatus(callback) {
  updateBotStatusCallback = callback;
}

// Trigger the bot status update
function triggerUpdateBotStatus() {
  if (updateBotStatusCallback) updateBotStatusCallback();
}

// Add a log entry
function addLog(message) {
  const timestamp = new Date().toLocaleString();
  logs.push(`[${timestamp}] ${message}`); // ✅ fixed template literal
}

// Return all logs
function getLogs() {
  return logs;
}

// HTTP server
const server = http.createServer((req, res) => {
  let filePath = "." + req.url;
  if (filePath === "./") filePath = "./dashboard.html";

  const url = new URL(req.url, `http://${req.headers.host}`);
  const password = url.searchParams.get("password");

  // Password protection
  if (filePath.startsWith("./dashboard.html")) {
    if (password !== "secret77") {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Dashboard Password");
      return;
    }
  }

  if (filePath.startsWith("./secret.html")) {
    if (password !== "owner77") {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Secret Page Password");
      return;
    }
  }

  // Serve logs via API
  if (filePath.startsWith("./logs")) {
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
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".woff": "application/font-woff",
    ".ttf": "application/font-ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".otf": "application/font-otf",
    ".svg": "application/image/svg+xml",
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
