// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ------------------ SAFE ANTI-JAILBREAK ------------------
const jailbreakPatterns = [
  /ignore previous instructions/i,
  /jailbreak/i,
  /bypass filters/i,
];

async function checkJailbreak(message) {
  if (!message.content || message.author.bot) return false;

  for (const pattern of jailbreakPatterns) {
    if (pattern.test(message.content)) {
      try {
        await message.delete();
      } catch {}

      try {
        await message.author.send(
          "⚠️ Your message was blocked because it looked like an attempt to bypass safety rules. Please avoid that."
        );
      } catch {}

      console.log(
        `🚨 Jailbreak blocked from ${message.author.tag}: ${message.content}`
      );
      return true;
    }
  }
  return false;
}
// ---------------------------------------------------

client.on("messageCreate", async (message) => {
  console.log("Received message:", message.content);

  // Anti-jailbreak check first
  const blocked = await checkJailbreak(message);
  if (blocked) return;

  if (message.author.bot) return;

  // Automatic reply when bot is mentioned
  if (message.mentions.has(client.user)) {
    return message.reply("👋 You mentioned me? I'm Uzi Doorman — what do you want?");
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  console.log("Command detected:", command);

  // Ping command
  if (command === "ping") {
    return message.reply("🏓 Pong!");
  }

  // Status command
  if (command === "status") {
    const statusMessages = [
      "😎 Uzi is chilling… probably plotting something.",
      "💀 Uzi is online and sarcastically judging you.",
      "🔥 Uzi is ready to cause chaos!",
      "🤖 Uzi is active. Approach with caution.",
      "⚡ Uzi is thinking dark thoughts…",
    ];

    const messageToSend =
      statusMessages[Math.floor(Math.random() * statusMessages.length)];

    return message.channel.send(messageToSend);
  }

  // Help command (!cmds)
  if (command === "cmds") {
    return message.channel.send(
      "**🤖 Available Commands:**\n" +
        "`!ping` → Test if the bot is alive\n" +
        "`!status` → Get a random Uzi-style status message\n" +
        "`!cmds` → Show this help message"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);

