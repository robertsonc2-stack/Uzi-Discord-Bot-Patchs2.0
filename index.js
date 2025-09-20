// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverModule = require("./server.js"); // server.js exports addLog and commands

// --- Create bot client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Dynamic log function using authorizedUserId from server.js ---
async function logEvent(message) {
  const time = new Date().toLocaleTimeString();
  const logMsg = `[${time}] ${message}`;
  console.log(logMsg);

  try {
    if (client.isReady() && serverModule.authorizedUserId) {
      const user = await client.users.fetch(serverModule.authorizedUserId);
      if (user) user.send(`📩 ${logMsg}`).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to send log DM:", err);
  }

  // Also push to dashboard
  if (serverModule.addLog) serverModule.addLog(logMsg);

  return logMsg;
}

// --- Bot ready event ---
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await logEvent(`Bot logged in as ${client.user.tag}`);
});

// --- Commands ---
const PREFIX = "!";
const commands = serverModule.commands; // commands imported from server.js

// --- Message listener ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands[commandName];
  if (!command) return;

  try {
    // Example commands implementation
    if (commandName === "ping") await message.reply("🏓 Pong!");
    if (commandName === "status")
      await message.reply(
        `✅ Online as ${client.user.tag}\n🌍 Servers: ${client.guilds.cache.size}`
      );
    if (commandName === "cmds") {
      let list = "**🤖 Commands:**\n";
      for (const [name, desc] of Object.entries(commands)) {
        list += `\`!${name}\` → ${desc}\n`;
      }
      await message.channel.send(list);
    }
    if (commandName === "logs")
      await message.author.send(
        "📂 Logs are automatically sent to your DMs from the dashboard authorization."
      );
    if (commandName === "dashboard")
      await message.reply("🌐 Open the bot dashboard: http://localhost:3000/dashboard");

    await logEvent(
      `Command used: !${commandName} by ${message.author.tag} in #${message.channel.name}`
    );
  } catch (err) {
    console.error("Command error:", err);
    message.reply("⚠️ Error running command.");
  }
});

// --- Login ---
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("❌ Failed to login:", err);
  process.exit(1);
});
