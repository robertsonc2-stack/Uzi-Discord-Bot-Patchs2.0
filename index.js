require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const server = require("./server.js");

const PREFIX = "!"; // Bot prefix
const OWNER_ID = "YOUR_USER_ID"; // Replace with your Discord ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Logs helper ---
function logEvent(message) {
  console.log(message);
  server.addLog(message); // Sends logs to secret.html
}

// --- Update bot status safely ---
function updateBotStatus(newStatus) {
  try {
    if (client.user && typeof client.user.setActivity === "function") {
      client.user.setActivity(newStatus || "Online", { type: "WATCHING" });
      logEvent(`Bot status updated to: ${newStatus}`);
    }
  } catch (err) {
    console.error("Failed to update bot status:", err);
  }
}

// Register the status updater with server
server.setUpdateBotStatus(updateBotStatus);

client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag}`);
  updateBotStatus("Online");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bots

  const isCommand = message.content.startsWith(PREFIX);
  const userMessage = message.content.trim();

  // Log only commands and user messages to bot
  if (isCommand || userMessage.toLowerCase().includes(client.user.username.toLowerCase())) {
    logEvent(`[${message.author.tag}] ${message.content}`);
  }

  if (!isCommand) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // --- Commands ---
  if (command === "status") {
    if (message.author.id !== OWNER_ID) return message.reply("❌ You cannot change the bot status.");
    const newStatus = args.join(" ");
    if (!newStatus) return message.reply("⚠️ Please provide a new status.");
    updateBotStatus(newStatus);
    return message.reply(`✅ Bot status updated to: ${newStatus}`);
  }

  if (command === "cmds") {
    const availableCommands = [
      "`!status <message>` → Change bot status (owner only)",
      "`!cmds` → Show this command list"
    ];
    return message.reply("**Available Commands:**\n" + availableCommands.join("\n"));
  }
});

// --- Start bot ---
client.login(process.env.DISCORD_TOKEN)
  .catch(err => {
    console.error("Failed to login:", err);
  });
