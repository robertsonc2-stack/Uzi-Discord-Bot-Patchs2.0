const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 3000;

let logs = [];

let botSettings = {
    statusMessage: "Online",
    prefix: "!"
};

function addLog(message) {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
}

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

    // Dashboard
    if (pathname === "/" || pathname === "/dashboard.html") {
        return serveFile(res, path.join(__dirname, "dashboard.html"), "text/html");
    }

    // Secret page
    if (pathname === "/secret.html") {
        return serveFile(res, path.join(__dirname, "secret.html"), "text/html");
    }

    // Logs as JSON
    if (pathname === "/logs") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(logs));
    }

    // Change bot status instantly
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

    // Log secret access0
    if (pathname === "/log-access") {
        const user = urlObj.query.user || "Unknown";
        addLog(`Secret page accessed by: ${user}`);
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("Access logged");
    }

    // Serve static files
    const filePath = path.join(__dirname, pathname);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = ext === ".css" ? "text/css" : "application/javascript";
        return serveFile(res, filePath, contentType);
    }

    // 404
    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    addLog("Server started");
});

module.exports = { addLog, botSettings };
0
