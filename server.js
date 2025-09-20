const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Helper to serve JSON
function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// Helper to serve static files
function serveStatic(req, res) {
  const publicDir = path.join(__dirname, "public");
  let filePath = path.join(publicDir, req.url === "/" ? "/index.html" : req.url);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found");
    } else {
      // Basic MIME type handling
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
      res.end(content);
    }
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = req.url;

  // --- API Routes ---
  if (url === "/api/bots" && req.method === "GET") {
    return sendJson(res, [
      { name: "Uzi-Doorman", description: "Roleplays as Uzi Doorman from Murder Drones", prefix: "!", status: "online" },
      { name: "SD-N", description: "Roleplays as SD-N from Murder Drones", prefix: "/", status: "online" },
      { name: "SD-V", description: "Roleplays as SD-V from Murder Drones", prefix: "/", status: "online" }
    ]);
  }

  if (url === "/api/status" && req.method === "GET") {
    return sendJson(res, {
      status: "running",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  if (url === "/api/discord-status" && req.method === "GET") {
    try {
      const client = require("./index.js");
      return sendJson(res, {
        loggedIn: client.user ? true : false,
        username: client.user ? client.user.tag : "Not logged in",
        guilds: client.guilds ? client.guilds.cache.size : 0,
        users: client.users ? client.users.cache.size : 0
      });
    } catch (err) {
      return sendJson(res, { loggedIn: false, error: err.message });
    }
  }

  if (url === "/health" && req.method === "GET") {
    return sendJson(res, { status: "healthy" });
  }

  // --- Serve Static Files or SPA ---
  const publicDir = path.join(__dirname, "public");
  const indexFile = path.join(publicDir, "index.html");

  fs.stat(path.join(publicDir, req.url), (err, stats) => {
    if (!err && stats.isFile()) {
      return serveStatic(req, res);
    } else {
      // Serve index.html for SPA routing
      fs.readFile(indexFile, (err, content) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Something broke!");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(content);
        }
      });
    }
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the bot dashboard`);
});

// --- Start Discord Bot ---
try {
  require("./index.js");
  console.log("Discord bot started successfully");
} catch (err) {
  console.error("Failed to start Discord bot:", err);
}
