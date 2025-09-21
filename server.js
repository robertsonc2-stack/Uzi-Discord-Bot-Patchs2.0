const http = require("http");
const fs = require("fs");
const path = require("path");

let updateBotStatusCallback = null;

// Allow index.js to register a bot status updater
function setUpdateBotStatus(callback) {
  updateBotStatusCallback = callback;
}

// Trigger the callback if it's set
function triggerUpdateBotStatus() {
  if (updateBotStatusCallback) updateBotStatusCallback();
}

const server = http.createServer((req, res) => {
  let filePath = "." + req.url;
  if (filePath === "./") {
    filePath = "./dashboard.html";
  }

  // Handle dashboard password
  if (filePath === "./dashboard.html") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const password = url.searchParams.get("password");
    if (password !== "secret77") {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Dashboard Password");
      return;
    }
  }

  // Handle secret page password
  if (filePath === "./secret.html") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const password = url.searchParams.get("password");
    if (password !== "owner77") {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid Secret Page Password");
      return;
    }
  }

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

// Export functions so index.js can use them
module.exports = {
  setUpdateBotStatus,
  triggerUpdateBotStatus
};
