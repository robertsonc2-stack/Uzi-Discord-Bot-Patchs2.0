// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverSettingsModule = require("./serverSettings.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Ready Event ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Helper: Check if user is allowed in guild ---
function isUserAllowed(guildId, userId) {
  const allowedUsers = serverSettingsModule.getAllowedUsers(guildId);
  return allowedUsers.includes(userId);
}

// --- Message Event ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bot messages
  if (!message.guild) return; // Only work in servers

  const guildId = message.guild.id;
  const settings = serverSettingsModule.getSettings(guildId);
  const prefix = settings.botPrefix || "!";

  // Only process messages starting with prefix
  if (!message.content.startsWith(prefix)) return;

  // Access control: Only allowed users can run commands
  if (!isUserAllowed(guildId, message.author.id)) {
    console.log(`⚠️ Unauthorized user ${message.author.tag} tried a command.`);
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  console.log(`📥 Command received from ${message.author.tag}: ${command}`);

  // --- Commands ---
  if (command === "status") {
    const statusMsg = settings.statusMessage || "Uzi is online";
    return message.channel.send(`💬 Current status: ${statusMsg}`);
  }

  if (command === "cmds") {
    return message.channel.send(
      "**🤖 Available Commands:**\n" +
      `\`${prefix}status\` → Show current bot status\n` +
      `\`${prefix}cmds\` → Show this command list`
    );
  }
});

// --- Optional: Monitor dashboard settings periodically ---
setInterval(() => {
  client.guilds.cache.forEach(guild => {
    const settings = serverSettingsModule.getSettings(guild.id);
    if (settings.statusMessage && client.user) {
      // Set bot presence based on statusMessage
      client.user.setActivity(settings.statusMessage, { type: "WATCHING" }).catch(() => {});
    }
  });
}, 10000); // Every 10 seconds

// --- Login ---
client.login(process.env.DISCORD_TOKEN);

