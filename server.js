const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DASHBOARD_PASSWORD = "secret77"; // Dashboard password
const SECRET_PASSWORD = "owner77";     // Secret page password

let logs = [];

// Add log function
function addLog(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  logs.push(logMessage);
  console.log(logMessage);
}

const server = http.createServer((req, res) => {
  if (req.url === "/logs.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(logs));
  }

  if (req.url.startsWith("/check-password")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const password = url.searchParams.get("password");
    const page = url.searchParams.get("page");

    if ((page === "dashboard" && password === DASHBOARD_PASSWORD) ||
        (page === "secret" && password === SECRET_PASSWORD)) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("OK");
    } else {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("WRONG");
    }
  }

  let filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "dashboard.html" : req.url
  );

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("404 Not Found");
    }
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, () => addLog(`Server running at http://localhost:${PORT}`));

module.exports = { addLog, logs };
