let logs = [];
let listeners = [];

function logMessage(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  logs.push(entry);
  if (logs.length > 100) logs.shift(); // keep last 100
  listeners.forEach((cb) => cb(entry));
}

function addLogListener(cb) {
  listeners.push(cb);
}

function getLogs() {
  return logs;
}

// Load commands from index.js dynamically
let commandsRef = {};
function setCommands(ref) {
  commandsRef = ref;
}
function getCommands() {
  return commandsRef;
}

module.exports = { logMessage, addLogListener, getLogs, setCommands, getCommands };
