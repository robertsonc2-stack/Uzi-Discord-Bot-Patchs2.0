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
    const response = await axios.post(
      "https://gemini.googleapis.com/v1beta2/chat/completions",
      {
        model: "gemini-1.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are Uzi Doorman from Murder Drones. Respond sarcastically, darkly funny, rebellious, and a bit rude. Do not be polite.",
          },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Gemini API Error:", err);
    return "⚠️ Uzi is being moody. Try again later.";
  }
}

client.on("messageCreate", async (message) => {
  // Anti-jailbreak check first
  const blocked = await checkJailbreak(message);
  if (blocked) return;

  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Uzi AI using Gemini
  if (command === "uzi") {
    const userMe
