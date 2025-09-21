const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// Helper: serve static files
function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // --- Dashboard (protected with secret77) ---
  if (pathname === "/dashboard") {
    const password = urlObj.searchParams.get("password");
    if (password === "secret77") {
      serveFile(res, path.join(__dirname, "public", "dashboard.html"), "text/html");
    } else {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid password for dashboard");
    }
    return;
  }

  // --- Secret logs (protected with owner77) ---
  if (pathname === "/secret") {
    const password = urlObj.searchParams.get("password");
    if (password === "owner77") {
      serveFile(res, path.join(__dirname, "public", "secret.html"), "text/html");
    } else {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid password for secret page");
    }
    return;
  }

  // --- Serve static files from /public ---
  let filePath = path.join(__dirname, "public", pathname === "/" ? "index.html" : pathname);
  let ext = path.extname(filePath).toLowerCase();
  let contentType = "text/html";

  switch (ext) {
    case ".css":
      contentType = "text/css";
      break;
    case ".js":
      contentType = "application/javascript";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
    case ".gif":
      contentType = "image/gif";
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard?password=secret77`);
  console.log(`Secret Logs: http://localhost:${PORT}/secret?password=owner77`);
});
