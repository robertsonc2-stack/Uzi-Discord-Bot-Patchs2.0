require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const https = require("https");

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Load settings from server module
const serverModule = require("./server.js"); // your HTTP server with dashboard

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OWNER_ID = process.env.DISCORD_OWNER_ID;
const GITHUB_REPO = process.env.GITHUB_REPO;

let logs = [];

// Logging helper
function logEvent(message) {
  const timestamp = new Date().toLocaleString();
  const logMsg = `[${timestamp}] ${message}`;
  logs.push(logMsg);
  // Send log to owner DM
  client.users.fetch(OWNER_ID).then(user => {
    user.send(logMsg).catch(() => {});
  });
  console.log(logMsg);
}

// Bot status update helper
function updateBotStatus() {
  const statusMsg = serverModule.botSettings.statusMessage || "Online";
  if (client.user) client.user.setActivity(statusMsg, { type: 3 }); // WATCHING
}

// GitHub update check
function checkForUpdates() {
  if (!GITHUB_REPO) return logEvent("GitHub repo not set in .env");

  const apiUrl = GITHUB_REPO.replace("https://github.com/", "https://api.github.com/repos/") + "/releases/latest";
  const options = { headers: { "User-Agent": "Node.js" } };

  https.get(apiUrl, options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      try {
        const release = JSON.parse(data);
        logEvent(`Latest release: ${release.tag_name}`);
      } catch (err) {
        logEvent("Failed to parse GitHub release info: " + err);
      }
    });
  }).on("error", err => logEvent("Error fetching GitHub release: " + err));
}

// Discord ready event
client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag}`);
  updateBotStatus();
});

// Message handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // !cmds
  if (content === "!cmds") {
    const commandsList = [
      "!cmds - Show this message",
      "!update - Check GitHub for updates",
      "!status - Show current bot status",
    ];
    message.reply("Available commands:\n" + commandsList.join("\n"));
    return;
  }

  // !update
  if (content === "!update") {
    checkForUpdates();
    message.reply("Checking GitHub repo for updates...");
    return;
  }

  // !status
  if (content === "!status") {
    message.reply(`Bot status: ${serverModule.botSettings.statusMessage || "Online"}`);
    return;
  }

  // Log any user messages trying to interact with the bot
  logEvent(`Message from ${message.author.tag}: ${message.content}`);
});

// Start server and bot
serverModule.startServer(() => {
  logEvent("HTTP server started at http://localhost:3000/dashboard.html");
  client.login(DISCORD_TOKEN).catch(err => logEvent("Failed to login: " + err));
});

// Export logs and status for server.js
module.exports = {
  logs,
  updateBotStatus,
  checkForUpdates
};
