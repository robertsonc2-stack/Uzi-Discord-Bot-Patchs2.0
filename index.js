// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

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

// Function to get Gemini AI replies acting like Uzi Doorman
async function getUziGeminiReply(userMessage) {
  try {
    console.log("Sending message to Gemini:", userMessage);

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-turbo:generateMessage",
      {
        prompt: [
          {
            role: "system",
            content:
              "You are Uzi Doorman from Murder Drones. Respond sarcastically, darkly funny, rebellious, and a bit rude. Do not be polite.",
          },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Gemini response received");
    return response.data?.candidates?.[0]?.content || "⚠️ Uzi is being moody.";
  } catch (err) {
    console.error(
      "Gemini API Error:",
      err.response ? err.response.data : err.message
    );
    return "⚠️ Uzi is being moody. Try again later.";
  }
}

client.on("messageCreate", async (message) => {
  console.log("Received message:", message.content);

  // Anti-jailbreak check first
  const blocked = await checkJailbreak(message);
  if (blocked) return;

  if (message.author.bot) return;

  // Automatic AI reply when bot is mentioned
  if (message.mentions.has(client.user)) {
    const userMessage = message.content.replace(/<@!?(\d+)>/, "").trim(); // Remove mention from text
    const reply = userMessage
      ? await getUziGeminiReply(userMessage)
      : "👋 You mentioned me? I'm Uzi Doorman — what do you want?";
    return message.reply(reply);
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


