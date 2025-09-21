const http = require("http");
const fs = require("fs");
const path = require("path");

let updateBotStatusCallback = null;
let logs = [];

// Register status updater
function setUpdateBotStatus(callback) {
  updateBotStatusCallback = callback;
}

function triggerUpdateBotStatus(newStatus) {
  if (updateBotStatusCallback) updateBotStatusCallback(newStatus);
}

function addLog(message) {
  const timestamp = new Date().toLocaleString();
  logs.push(`[${timestamp}] ${message}`);
}

function getLogs() {
  return logs;
}

// Serve files from the "public" folder
const PUBLIC_DIR = path.join(__dirname);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.join(PUBLIC_DIR, url.pathname);

  if (url.pathname === "/" || url.pathname === "/dashboard.html") {
    filePath = path.join(PUBLIC_DIR, "dashboard.html");
  } else if (url.pathname === "/secret.html") {
    filePath = path.join(PUBLIC_DIR, "secret.html");
  } else if (url.pathname === "/change-status") {
    const newStatus = url.searchParams.get("status") || "Online";
    triggerUpdateBotStatus(newStatus);
    addLog(`Bot status changed to: ${newStatus}`);
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("Status updated successfully");
  } else if (url.pathname === "/logs") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(getLogs()));
  }

  // Determine content type
  const extname = path.extname(filePath).toLowerCase();
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
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content, "utf-8");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = {
  setUpdateBotStatus,
  triggerUpdateBotStatus,
  addLog,
  getLogs
};
