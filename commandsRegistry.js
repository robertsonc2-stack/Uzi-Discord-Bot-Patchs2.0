// commandsRegistry.js
const commands = {};

function registerCommand(name, description, callback) {
  commands[name] = { description, callback };
}

function getCommands() {
  return commands;
}

module.exports = { registerCommand, getCommands };
