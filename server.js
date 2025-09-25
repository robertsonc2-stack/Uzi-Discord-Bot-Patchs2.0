const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// Bot settings accessible to index.js
const botSettings = {
  statusMessage: "Online",
  prefix: "!",
};

// Simple logs array
let logs = [];

// Logging helper
function addLog(message) {
  const timestamp = new Date().toLocaleString();
  const logMsg = `[${timestamp}] ${message}`;
  logs.push(logMsg);
  console.log(logMsg);
}

// Serve HTML files
function serveFile(filePath, res) {
  fs.readFile(path.join(__dirname, filePath), (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
}

// HTTP server
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/dashboard.html") {
    serveFile("dashboard.html", res);
  } else if (req.url === "/secret.html") {
    serveFile("secret.html", res);
  } else if (req.url.startsWith("/update-status") && req.method === "POST") {
    // parse POST data
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (data.statusMessage) botSettings.statusMessage = data.statusMessage;
        addLog(`Status updated to: ${botSettings.statusMessage}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
  } else {
    res.writeHead(404);
    res.end("404 Not Found");
  }
});

// Exported function to start server
function startServer(callback) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/dashboard.html`);
    if (callback) callback();
  });
}

module.exports = {
  botSettings,
  logs,
  addLog,
  startServer
};
