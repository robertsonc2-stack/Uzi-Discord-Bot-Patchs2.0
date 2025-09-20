require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverSettings = require("./serverSettings.js");
const { registerCommand, getCommands } = require("./commandsRegistry.js");
require("./server.js"); // start HTTP server automatically

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- Commands ---
registerCommand("status", "Show current bot status", (message, args, settings) => {
  message.channel.send(`💬 Current status: ${settings.statusMessage}`);
});

registerCommand("dashboard", "Open server dashboard", (message, args, settings) => {
  const dashboardURL = `http://localhost:3000/dashboard?guildId=${message.guild.id}&userId=${message.author.id}`;
  message.channel.send({
    content: "🔗 Open your dashboard:",
    components: [
      {
        type: 1,
        components: [
          { type: 2, label: "Dashboard", style: 5, url: dashboardURL }
        ]
      }
    ]
  });
});

registerCommand("cmds", "Show all commands", (message) => {
  const prefix = serverSettings.getSettings(message.guild.id).botPrefix || "!";
  const cmds = getCommands();
  let reply = "**🤖 Commands:**\n";
  for (const cmd in cmds) {
    reply += `\`${prefix}${cmd}\` → ${cmds[cmd].description}\n`;
  }
  reply += "\n📥 Command usage is logged to console.";
  message.channel.send(reply);
});

// --- Ready ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Messages ---
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const settings = serverSettings.getSettings(message.guild.id);
  const prefix = settings.botPrefix || "!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const cmd = getCommands()[commandName];
  if (cmd) {
    console.log(`📥 Command from ${message.author.tag}: ${commandName}`);
    try { cmd.callback(message, args, settings); } 
    catch (err) { 
      console.error("Command error:", err);
      message.channel.send("⚠️ There was an error executing that command.");
    }
  }
});

// --- Update bot presence on settings change ---
serverSettings.setOnChange((guildId, settings) => {
  if (client.user) {
    try { client.user.setActivity(settings.statusMessage, { type: "WATCHING" }); } 
    catch (err) { console.error("Failed to set activity:", err); }
  }
});

// --- Login ---
client.login(process.env.DISCORD_TOKEN);
