const { Client, GatewayIntentBits } = require("discord.js");
const server = require("./server.js"); // dashboard server
const fs = require("fs");

// Load bot settings (prefix, status message, etc.)
let settings = {
  prefix: "!",
  statusMessage: "Online"
};

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Command list
const commands = {
  help: "Shows this help message.",
  cmds: "Lists all commands.",
  status: "Shows the current bot status.",
  setstatus: "Owner only — sets a new bot status.",
};

// Update bot status
function updateBotStatus() {
  if (client.user) {
    client.user.setActivity(settings.statusMessage, { type: 3 });
  }
}

// Log events to dashboard
function logEvent(message) {
  server.addLog(`[${new Date().toLocaleString()}] ${message}`);
}

// Handle messages
client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith(settings.prefix) || msg.author.bot) return;

  const args = msg.content.slice(settings.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "help") {
    let reply = "**Help Menu**\n";
    for (const cmd in commands) {
      reply += `\`${settings.prefix}${cmd}\` - ${commands[cmd]}\n`;
    }
    msg.reply(reply);
    logEvent(`${msg.author.tag} used !help`);
  }

  else if (command === "cmds") {
    msg.reply("Available commands: " + Object.keys(commands).map(c => settings.prefix + c).join(", "));
    logEvent(`${msg.author.tag} checked commands`);
  }

  else if (command === "status") {
    msg.reply(`Current status: **${settings.statusMessage}**`);
    logEvent(`${msg.author.tag} checked status`);
  }

  else if (command === "setstatus") {
    if (msg.author.id !== "YOUR_USER_ID") return msg.reply("❌ You don’t have permission.");
    const newStatus = args.join(" ");
    if (!newStatus) return msg.reply("Please provide a new status message.");
    settings.statusMessage = newStatus;
    updateBotStatus();
    msg.reply(`✅ Status updated to: **${newStatus}**`);
    logEvent(`${msg.author.tag} updated status to "${newStatus}"`);
  }

  else if (command === "unicode") {
    if (!args.length) return msg.reply("Please provide text to translate.");
    const translated = args.join(" ")
      .split("")
      .map(c => "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4))
      .join(" ");
    msg.reply("Unicode translation:\n" + translated);
    logEvent(`${msg.author.tag} translated text to Unicode`);
  }
});

// When bot is ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  updateBotStatus();
  logEvent("Bot started and is online.");
});

// Login with your bot token
client.login("MTQxMzg1MjQ5NTY4NzcxMjgxMg.G6XUyV.tQoP56YUEuBj_PiRZB9m9LyMXaE3orU1S8xY2o");

