const http = require("http");
const fs = require("fs");
const path = require("path");

let botSettings = {
    prefix: "!",
    statusMessage: "Online"
};

let logs = [];
let updateBotStatusCallback = null;

function setUpdateBotStatus(callback) {
    updateBotStatusCallback = callback;
}

function addLog(message) {
    const timestamp = new Date().toLocaleString();
    logs.push(`[${timestamp}] ${message}`);
    if (logs.length > 50) logs.shift(); // keep only 50 logs
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Serve dashboard.html
    if (pathname === "/" || pathname === "/dashboard.html") {
        fs.readFile(path.join(__dirname, "dashboard.html"), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end("Dashboard not found");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });
        return;
    }

    // Serve secret.html
    if (pathname === "/secret.html") {
        fs.readFile(path.join(__dirname, "secret.html"), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end("Secret page not found");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });
        return;
    }

    // Change bot status
    if (pathname === "/change-status") {
        const newStatus = url.searchParams.get("status");
        if (newStatus) {
            botSettings.statusMessage = newStatus;
            if (updateBotStatusCallback) updateBotStatusCallback(newStatus);
            addLog(`Bot status changed to: ${newStatus}`);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Status updated");
        } else {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("No status provided");
        }
        return;
    }

    // ✅ New endpoint: return current bot status + prefix
    if (pathname === "/current-status") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            prefix: botSettings.prefix,
            status: botSettings.statusMessage
        }));
        return;
    }

    // Logs page
    if (pathname === "/logs") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(logs.join("\n"));
        return;
    }

    // Fallback for missing files
    res.writeHead(404);
    res.end("404 Not Found");
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});

module.exports = {
    setUpdateBotStatus,
    addLog,
    botSettings
};
