require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const server = require("./server.js"); // Server integration

const PREFIX_DEFAULT = server.botSettings.prefix || "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Log helper ---
function logEvent(msg) {
  server.addLog(msg);
}

// --- Update bot status ---
function updateBotStatus() {
  if (!client.user) return;
  const statusMsg = server.botSettings.statusMessage || "Watching everything";
  try {
    client.user.setActivity(statusMsg, { type: ActivityType.Watching });
    logEvent(`Status set to: ${statusMsg}`);
  } catch (err) {
    logEvent(`❌ Failed to set status: ${err.message}`);
  }
}

// Make server able to trigger status update
server.setUpdateBotStatus(() => updateBotStatus());

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
  if (message.author.bot) return;

  const prefix = server.botSettings.prefix || PREFIX_DEFAULT;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // --- Commands ---
  switch (command) {
    case "ping":
      return message.reply("🏓 Pong!");
    case "status":
      return message.reply(`Current status: ${server.botSettings.statusMessage}`);
    case "cmds":
      const cmdList = Object.entries(commands)
        .map(([cmd, desc]) => `${prefix}${cmd} → ${desc}`)
        .join("\n");
      return message.author.send(`**Available Commands:**\n${cmdList}`);
    case "logs":
      if (message.author.id !== server.authorizedUserId) return;
      return message.author.send("**Bot Logs:**\n" + (server.logs.join("\n") || "No logs yet."));
    case "dashboard":
      return message.author.send("🌐 Dashboard: http://localhost:3000/dashboard");
    default:
      return message.reply(`❌ Unknown command. Type ${prefix}cmds for a list.`);
  }
});

// --- Event logging ---
client.on("error", (err) => logEvent(`❌ Discord client error: ${err.message}`));
client.on("warn", (warn) => logEvent(`⚠️ Discord client warning: ${warn}`));
process.on("unhandledRejection", (reason) => logEvent(`❌ Unhandled Rejection: ${reason}`));

// --- Bot login ---
client.login(process.env.DISCORD_TOKEN)
  .then(() => logEvent(`✅ Bot logged in as ${client.user.tag}`))
  .catch((err) => {
    logEvent(`❌ Failed to login: ${err.message}`);
    process.exit(1);
  });

