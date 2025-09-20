// serverSettings.js
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "settings.json");
let settings = {};
let onChangeCallback = null;

// Load settings if file exists
if (fs.existsSync(filePath)) {
  try {
    settings = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    settings = {};
  }
}

function saveSettings() {
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
  if (onChangeCallback) {
    for (const guildId in settings) {
      onChangeCallback(guildId, settings[guildId]);
    }
  }
}

function getSettings(guildId) {
  if (!settings[guildId]) {
    settings[guildId] = { botPrefix: "!", statusMessage: "Watching over the server" };
  }
  return settings[guildId];
}

function setSettings(guildId, newSettings) {
  settings[guildId] = { ...getSettings(guildId), ...newSettings };
  saveSettings();
}

function setOnChange(cb) {
  onChangeCallback = cb;
}

module.exports = { getSettings, setSettings, setOnChange };
