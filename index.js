require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverModule = require("./server.js");

// Environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "";

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Logging helper
function logEvent(message) {
  serverModule.addLog(message);
}

// Update bot status
function updateBotStatus() {
  if (!client.user) return;
  client.user.setActivity(serverModule.botSettings.statusMessage || "Online", { type: "WATCHING" });
  logEvent(`Bot status set to: ${serverModule.botSettings.statusMessage}`);
}

// Commands
const commands = {
  cmds: {
    description: "Lists all commands",
    execute: (msg) => {
      const list = Object.keys(commands).map(cmd => `!${cmd} - ${commands[cmd].description}`).join("\n");
      msg.reply(`Available commands:\n${list}`);
      logEvent(`User ${msg.author.tag} requested command list`);
    }
  },
  status: {
    description: "Shows current bot status",
    execute: (msg) => {
      msg.reply(`Current status: ${serverModule.botSettings.statusMessage}`);
      logEvent(`User ${msg.author.tag} checked bot status`);
    }
  },
  update: {
    description: "Updates bot status (for owner only)",
    execute: (msg, args) => {
      if (msg.author.id !== process.env.OWNER_ID) return msg.reply("You cannot use this command.");
      const newStatus = args.join(" ");
      serverModule.botSettings.statusMessage = newStatus;
      updateBotStatus();
      msg.reply(`Status updated to: ${newStatus}`);
      logEvent(`Owner updated status to: ${newStatus}`);
    }
  },
  updatecheck: {
    description: "Checks for updates from GitHub",
    execute: async (msg) => {
      if (!GITHUB_REPO) return msg.reply("GitHub repo not set.");
      try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        const data = await res.json();
        msg.reply(`Latest release: ${data.name} (${data.tag_name})`);
        logEvent(`User ${msg.author.tag} checked for updates`);
      } catch (err) {
        msg.reply("Failed to fetch updates.");
        logEvent(`Error fetching updates: ${err.message}`);
      }
    }
  }
};

// Message handler
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(serverModule.botSettings.prefix)) return;

  const args = msg.content.slice(serverModule.botSettings.prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (commands[cmd]) {
    try {
      commands[cmd].execute(msg, args);
    } catch (err) {
      msg.reply("Error executing command.");
      logEvent(`Command error: ${err.message}`);
    }
  }
});

// Bot ready event
client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag}`);
  updateBotStatus();
});

// Start server and then bot
serverModule.startServer(() => {
  logEvent("HTTP server started");
  client.login(DISCORD_TOKEN);
});

module.exports = client;
