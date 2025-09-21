const http = require("http");
const fs = require("fs");
const path = require("path");

let updateBotStatusFn = null;
function setUpdateBotStatus(fn) {
  updateBotStatusFn = fn;
}

// Store bot settings
let botSettings = {
  statusMessage: "Online",
  prefix: "!"
};

// Logs
let logs = [];

// Serve files
function serveFile(res, filePath, contentType) {
  fs.readFile(path.join(__dirname, filePath), (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("File not found");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/dashboard.html") {
    serveFile(res, "dashboard.html", "text/html");
  }
  else if (req.url === "/secret.html") {
    serveFile(res, "secret.html", "text/html");
  }
  // API: update status
  else if (req.url === "/updateStatus" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { status } = JSON.parse(body);
        if (status) {
          botSettings.statusMessage = status;
          logs.push(`[STATUS] Changed to "${status}"`);
          if (updateBotStatusFn) updateBotStatusFn();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, newStatus: status }));
        } else {
          res.writeHead(400);
          res.end("Missing status");
        }
      } catch {
        res.writeHead(500);
        res.end("Error parsing request");
      }
    });
  }
  // API: get logs
  else if (req.url === "/logs") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(logs));
  }
  else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3000, () =>
  console.log("🌐 Dashboard running at http://localhost:3000/dashboard.html")
);

module.exports = { setUpdateBotStatus, botSettings };
