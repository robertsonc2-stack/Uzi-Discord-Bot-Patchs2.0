require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const server = require("./server.js"); // Our server.js

const PREFIX_DEFAULT = server.botSettings.prefix || "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Logs helper ---
function logEvent(msg) {
  server.addLog(msg);
}

// --- Bot ready ---
client.once("ready", () => {
  logEvent(`✅ Bot logged in as ${client.user.tag}`);

  // Initial activity
  updateBotStatus();

  // Update activity periodically if changed from dashboard
  setInterval(updateBotStatus, 10000);
});

// --- Update bot status function ---
function updateBotStatus() {
  if (client.user) {
    const statusMsg = server.botSettings.statusMessage || "Watching everything";
    try {
      client.user.setActivity(statusMsg, { type: ActivityType.Watching });
      logEvent(`Status set to: ${statusMsg}`);
    } catch (err) {
      logEvent(`❌ Failed to set status: ${err.message}`);
    }
  }
}

// --- Make server.js able to trigger status update ---
server.setUpdateBotStatus(() => {
  updateBotStatus();
});

// --- Commands ---
const commands = {
  ping: "Test if bot is alive",
  status: "Show bot status",
  cmds: "Show all commands",
  logs: "View logs (DM only)",
  dashboard: "Open the bot dashboard",
};

// --- Message listener ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  const prefix = server.botSettings.prefix || PREFIX_DEFAULT;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // --- Commands ---
  if (command === "ping") return message.reply("🏓 Pong!");
  if (command === "status") return message.reply(`Current status: ${server.botSettings.statusMessage}`);
  
  if (command === "cmds") {
    const cmdList = Object.entries(commands)
      .map(([cmd, desc]) => `${prefix}${cmd} → ${desc}`)
      .join("\n");
    return message.author.send(`**Available Commands:**\n${cmdList}`);
  }

  if (command === "logs") {
    if (message.author.id !== server.authorizedUserId) return; // Only DM to authorized user
    return message.author.send("**Bot Logs:**\n" + (server.logs?.join("\n") || "No logs yet."));
  }

  if (command === "dashboard") {
    return message.author.send("🌐 Dashboard: http://localhost:3000/dashboard");
  }

  // Unknown command
  message.reply(`❌ Unknown command. Type ${prefix}cmds for a list.`);
});

// --- Error logging ---
client.on("error", (err) => logEvent(`❌ Discord client error: ${err.message}`));
client.on("warn", (warn) => logEvent(`⚠️ Discord client warning: ${warn}`));
process.on("unhandledRejection", (reason) => logEvent(`❌ Unhandled Rejection: ${reason}`));

// --- Login bot ---
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  logEvent(`❌ Failed to login: ${err.message}`);
  process.exit(1);
});
