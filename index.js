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

// --- Ready Event ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Message Event ---
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const settings = serverSettingsModule.getSettings(guildId);
  const prefix = settings.botPrefix || "!";

  // Only commands with prefix
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  console.log(`📥 Command from ${message.author.tag}: ${command}`);

  // --- Commands ---
  if (command === "status") {
    message.channel.send(`💬 Current status: ${settings.statusMessage}`);
  }

  if (command === "cmds") {
    message.channel.send(
      `**🤖 Commands:**\n` +
      `\`${prefix}status\` → show current status\n` +
      `\`${prefix}cmds\` → list commands\n` +
      `\`${prefix}dashboard\` → open dashboard`
    );
  }

  // Dashboard auto-fill info
  if (command === "dashboard") {
    const userId = message.author.id;
    const dashboardURL = `http://localhost:3000/?guildId=${guildId}&userId=${userId}`;
    return message.channel.send(`🔗 Access your dashboard: ${dashboardURL}`);
  }
});

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
}, 10000); // every 10 seconds

// --- Login ---
client.login(process.env.DISCORD_TOKEN);
