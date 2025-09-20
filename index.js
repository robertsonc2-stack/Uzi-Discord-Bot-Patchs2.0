// index.js
const { Client, GatewayIntentBits } = require("discord.js");

// === CONFIG ===
const PREFIX = "!"; // Command prefix
const TOKEN = "MTQxMzg1MjQ5NTY4NzcxMjgxMg.Gvi5tH.T-hI7yAaPm138R04YvKKBpn7hTnpPosHPOEZOQ"; // Replace with your bot token

// Create the Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Event: Bot is ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Event: Message received
client.on("messageCreate", (message) => {
  // Ignore bots and messages without prefix
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // --- Uzi Doorman Roleplay Command ---
  if (command === "uzi") {
    const userMessage = args.join(" ");

    // Uzi-style responses
    const uziResponses = [
      `😎 Uzi: "${userMessage}? Seriously? That’s nothing for me."`,
      `😏 Uzi: "Oh great, '${userMessage}'. Classic."`,
      `💀 Uzi: "Honestly, I don’t care about '${userMessage}'."`,
      `🙄 Uzi: "Yeah right… '${userMessage}', sure."`,
      `🔫 Uzi: "‘${userMessage}’? Heh. Bring it on."`,
      `😈 Uzi: "You really think '${userMessage}' will stop me?"`,
    ];

    // If no message, give a default snarky line
    if (!userMessage) {
      uziResponses.push(
        "😒 Uzi: 'What do you want me to say, huh? Make it quick.'"
      );
    }

    // Pick a random response
    const reply = uziResponses[Math.floor(Math.random() * uziResponses.length)];
    return message.channel.send(reply);
  }

  // Optional: other commands
  if (command === "ping") {
    return message.reply("🏓 Pong!");
  }

  if (command === "hello") {
    return message.reply(`Hello, ${message.author.username}! 👋`);
  }
});

// Login the bot
client.login(TOKEN);


