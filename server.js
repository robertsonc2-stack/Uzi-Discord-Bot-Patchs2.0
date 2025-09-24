const http = require("http");
const fs = require("fs");
const path = require("path");
const { checkForUpdates, BOT_VERSION } = require("./index.js");

const PORT = 3000;
let logs = [];

// Helper to serve files
function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
}

// Main server
const server = http.createServer(async (req, res) => {
  if (req.url === "/" || req.url === "/dashboard.html") {
    serveFile(res, path.join(__dirname, "public", "dashboard.html"), "text/html");
  }
  else if (req.url === "/dashboard-data") {
    const updateInfo = await checkForUpdates();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      version: BOT_VERSION,
      updateInfo,
      logs
    }));
  }
  else if (req.url.endsWith(".js")) {
    serveFile(res, path.join(__dirname, "public", req.url), "application/javascript");
  }
  else if (req.url.endsWith(".css")) {
    serveFile(res, path.join(__dirname, "public", req.url), "text/css");
  }
  else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});

// Allow adding logs from other files
function addLog(message) {
  logs.push(message);
  if (logs.length > 50) logs.shift();
}

module.exports = { addLog };
