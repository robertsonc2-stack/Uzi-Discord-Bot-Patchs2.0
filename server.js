require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const server = require("./server.js"); // Import the server

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Logs helper ---
function logEvent(msg) {
  server.addLog(msg); // Send to server logs
  const authorizedId = server.authorizedUserId;
  if (authorizedId) {
    const user = client.users.cache.get(authorizedId);
    if (user) user.send(`📢 ${msg}`).catch(() => {}); // DM logs
  }
}

// --- Set bot status updater for server dashboard ---
server.setUpdateBotStatus(() => {
  if (client.user) {
    client.user.setActivity(server.botSettings.statusMessage, { type: "WATCHING" });
    logEvent(`Bot status updated to: ${server.botSettings.statusMessage}`);
  }
});

// --- On bot ready ---
client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag}`);
  if (client.user) {
    client.user.setActivity(server.botSettings.statusMessage, { type: "WATCHING" });
  }
});

// --- Command handler ---
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const PREFIX = server.botSettings.prefix; // Use dynamic prefix
  const isCommand = message.content.startsWith(PREFIX);
  const isMentioned = message.mentions.has(client.user);
  if (!isCommand && !isMentioned) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (isCommand) logEvent(`Command used by ${message.author.tag}: ${message.content}`);

  // --- !cmds command ---
  if (command === "cmds") {
    const cmdsList = Object.entries(server.commands)
      .map(([cmd, desc]) => `• ${cmd}: ${desc}`)
      .join("\n");
    message.author.send(`📜 Available commands:\n${cmdsList}`).catch(() => {});
    return;
  }

  // --- status command ---
  if (command === "status") {
    message.reply(`Current bot status: ${server.botSettings.statusMessage}`);
    return;
  }

  // --- Ping command ---
  if (command === "ping") {
    message.reply("🏓 Pong!");
    return;
  }

  // --- Dashboard command ---
  if (command === "dashboard") {
    message.reply("🌐 Access the dashboard at http://localhost:3000/dashboard");
    return;
  }

  // Add more commands here if needed...
});

// --- Start bot ---
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("Failed to login:", err);
  logEvent(`❌ Bot login failed: ${err.message}`);
});
