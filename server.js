// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
let logs = [];

function addLog(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  logs.push(logMessage);
  console.log(logMessage);
}

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'dashboard.html' : req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('404 Not Found');
    }
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, () => {
  addLog(`Server running on http://localhost:${PORT}`);
});

module.exports = {
  addLog,
  logs
};

