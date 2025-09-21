const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

// Dashboard password
const DASHBOARD_PASSWORD = "secret77";

// Store bot settings
let botSettings = {
  statusMessage: "Online",
  prefix: "!"
};

// Track login
let loggedIn = false;

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      if (loggedIn) {
        serveFile("dashboard.html", res);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <head><title>Login</title></head>
            <body style="font-family: Arial; text-align:center; margin-top:50px;">
              <h2>Dashboard Login</h2>
              <form method="POST" action="/login">
                <input type="password" name="password" placeholder="Enter Password" required />
                <button type="submit">Login</button>
              </form>
            </body>
          </html>
        `);
      }
    } else if (req.url === "/settings") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(botSettings));
    } else if (req.url === "/secret") {
      if (!loggedIn) {
        res.writeHead(403, { "Content-Type": "text/html" });
        res.end("<h3>Access denied. Please <a href='/'>login</a> first.</h3>");
      } else {
        serveFile("secret.html", res);
      }
    } else {
      // Serve static files like dashboard.html, css, etc.
      const filePath = path.join(__dirname, req.url);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    }
  } else if (req.method === "POST") {
    if (req.url === "/login") {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        const { password } = querystring.parse(body);
        if (password === DASHBOARD_PASSWORD) {
          loggedIn = true;
          res.writeHead(302, { Location: "/" });
          res.end();
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<h3>Wrong password. <a href='/'>Try again</a></h3>");
        }
      });
    } else if (req.url === "/update-settings") {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data.statusMessage) botSettings.statusMessage = data.statusMessage;
          if (data.prefix) botSettings.prefix = data.prefix;

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, settings: botSettings }));
        } catch (err) {
          res.writeHead(400);
          res.end("Invalid JSON");
        }
      });
    }
  }
});

// Helper to serve HTML files
function serveFile(fileName, res) {
  const filePath = path.join(__dirname, fileName);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Server Error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
}

server.listen(3000, () => {
  console.log("Dashboard running at http://localhost:3000");
});

// Export settings for index.js
module.exports = { botSettings };
