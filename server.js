// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 3000;

// In-memory logs
let logs = [];

// Bot settings
let botSettings = {
    statusMessage: "Online",
    prefix: "!"
};

// Helper to add logs
function addLog(message) {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
}

// Serve static HTML files
function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not Found");
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        }
    });
}

const server = http.createServer((req, res) => {
    const urlObj = url.parse(req.url, true);
    const pathname = urlObj.pathname;

    // Serve dashboard.html
    if (pathname === "/" || pathname === "/dashboard.html") {
        return serveFile(res, path.join(__dirname, "dashboard.html"), "text/html");
    }

    // Serve secret.html
    if (pathname === "/secret.html") {
        return serveFile(res, path.join(__dirname, "secret.html"), "text/html");
    }

    // Serve logs as JSON
    if (pathname === "/logs") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(logs));
    }

    // Change bot status
    if (pathname === "/change-status") {
        const newStatus = urlObj.query.status;
        if (newStatus) {
            botSettings.statusMessage = newStatus;
            addLog(`Bot status changed to: ${newStatus}`);
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("Status updated");
        }
        res.writeHead(400);
        return res.end("Missing status parameter");
    }

    // Log access to secret page
    if (pathname === "/log-access") {
        const user = urlObj.query.user || "Unknown";
        addLog(`Secret page accessed by: ${user}`);
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("Access logged");
    }

    // Serve other static files if needed (CSS/JS)
    const filePath = path.join(__dirname, pathname);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = ext === ".css" ? "text/css" : "application/javascript";
        return serveFile(res, filePath, contentType);
    }

    // 404 fallback
    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    addLog("Server started");
});

// Export functions & settings for index.js
module.exports = { addLog, botSettings };
