// index.js
const { Client, GatewayIntentBits } = require("discord.js");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Bot ready event
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

// Respond to messages
client.on("messageCreate", (message) => {
  if (message.author.bot) return; // ignore other bots

  if (message.content === "!ping") {
    message.reply("🏓 Pong!");
  }

  if (message.content === "!hello") {
    message.reply(`Hello, ${message.author.username}! 👋`);
  }
});

// Login using your bot token
client.login("MTQxMzg1MjQ5NTY4NzcxMjgxMg.GBQLYS.294-7AqVTKoimlKOg593hkxKeJCbRPBraGbcPI");

