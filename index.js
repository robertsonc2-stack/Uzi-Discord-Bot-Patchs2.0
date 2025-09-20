// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverSettingsModule = require("./serverSettings.js");
require("./server.js"); // start HTTP server automatically

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- Command Registry ---
const commands = {};

// Helper to register commands
function registerCommand(name, description, callback) {
  commands[name] = { description, callback };
}

// --- Register Commands ---
registerCommand("status", "Show current bot status", (message, args, settings) => {
  message.channel.send(`💬 Current status: ${settings.statusMessage}`);
});

registerCommand("dashboard", "Open server dashboard (auto-detects your guild & user ID)", (message, args, settings) => {
  const dashboardURL = `http://localhost:3000/?guildId=${message.guild.id}&userId=${message.author.id}`;
  message.channel.send(`🔗 Access your dashboard: ${dashboardURL}`);
});

registerCommand("cmds", "Show all commands", (message) => {
  const prefix = serverSettingsModule.getSettings(message.guild.id).botPrefix || "!";
  let reply = "**🤖 Commands:**\n";
  for (const cmd in commands) {
    reply += `\`${prefix}${cmd}\` → ${commands[cmd].description}\n`;
  }
  reply += "\n**Logging Commands:**\n📥 All command usage is logged to the console.";
  message.channel.send(reply);
});

// --- Ready Event ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Message Event ---
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const settings = serverSettingsModule.getSettings(message.guild.id);
  const prefix = settings.botPrefix || "!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commands[commandName]) {
    console.log(`📥 Command from ${message.author.tag}: ${commandName}`);
    try {
      commands[commandName].callback(message, args, settings);
    } catch (err) {
      console.error("Command error:", err);
      message.channel.send("⚠️ There was an error executing that command.");
    }
  }
});

// --- Export Commands for server.js ---
module.exports = { commands };

// --- Update bot presence from dashboard ---
setInterval(() => {
  client.guilds.cache.forEach(guild => {
    const settings = serverSettingsModule.getSettings(guild.id);
    if (settings.statusMessage && client.user) {
      try {
        client.user.setActivity(settings.statusMessage, { type: "WATCHING" });
      } catch (err) {
        console.error("Failed to set activity:", err);
      }
    }
  });
}, 10000);

// --- Login ---
client.login(process.env.DISCORD_TOKEN);
