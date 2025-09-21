const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const querystring = require("querystring");

const PORT = process.env.PORT || 3000;

// --- In-memory storage ---
let botSettings = {
  prefix: "!",
  statusMessage: "Online"
};

let logs = [];
let secretAccess = {}; // Track secret access per session (simple memory)

// --- Helpers ---
function addLog(message) {
  logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  console.log(message);
}

function serveFile(res, filePath, contentType = "text/html") {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Server error");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// --- HTTP Server ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // Serve dashboard HTML
  if (pathname === "/" || pathname === "/dashboard") {
    return serveFile(res, path.join(__dirname, "public/dashboard.html"));
  }

  // Serve secret page HTML
  if (pathname === "/secret") {
    return serveFile(res, path.join(__dirname, "public/secret.html"));
  }

  // Serve static files (CSS/JS)
  if (pathname.startsWith("/public/")) {
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    let contentType = "text/plain";
    if (ext === ".css") contentType = "text/css";
    if (ext === ".js") contentType = "application/javascript";
    return serveFile(res, filePath, contentType);
  }

  // --- API Routes ---
  if (pathname === "/api/status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(botSettings));
  }

  if (pathname === "/api/set-status" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        botSettings.statusMessage = data.statusMessage || botSettings.statusMessage;
        addLog(`Bot status changed to: ${botSettings.statusMessage}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }

  // Logs API
  if (pathname === "/api/logs" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(logs));
  }

  // Secret password API
  if (pathname === "/api/secret-password" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const data = querystring.parse(body);
      if (data.password === "coltonsr77") {
        // Use simple session-based access
        const sessionId = Date.now().toString();
        secretAccess[sessionId] = true;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, sessionId }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false }));
      }
    });
    return;
  }

  // Catch-all
  res.writeHead(404);
  res.end("Not Found");
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  addLog("Server started");
});

// Export for index.js
module.exports = {
  server,
  botSettings,
  addLog,
};

