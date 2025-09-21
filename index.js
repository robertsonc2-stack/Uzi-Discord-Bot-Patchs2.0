// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const server = require("./server.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "!";

function logEvent(message) {
  server.addLog(message); // send logs to server.js
}

client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag}`);
  client.user.setActivity("Online", { type: 3 });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Log only commands or messages directed to bot
  if (message.content.startsWith(PREFIX)) {
    logEvent(`Command used: ${message.content} by ${message.author.tag}`);
  }

  // Status command
  if (message.content.startsWith(`${PREFIX}status`)) {
    const statusMessage = message.content.slice(`${PREFIX}status`.length).trim();
    if (!statusMessage) return message.reply("Please provide a status message.");
    client.user.setActivity(statusMessage, { type: 3 });
    logEvent(`Status updated to: ${statusMessage}`);
    return message.reply(`Bot status updated to: "${statusMessage}"`);
  }

  // cmds command
  if (message.content.startsWith(`${PREFIX}cmds`)) {
    const commandsList = "`!status <message>` → Update bot status\n`!cmds` → List all commands";
    return message.reply(`Available commands:\n${commandsList}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
