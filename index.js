// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const PREFIX = "!";

// ------------------ LOGGER WITH DAILY ROTATION ------------------
function getLogFile(date = null) {
  const targetDate = date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const logDir = path.join(__dirname, "logs");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  return path.join(logDir, `${targetDate}.log`);
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  console.log(message);
  fs.appendFileSync(getLogFile(), logMessage, "utf8");
}
// ----------------------------------------------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ["CHANNEL"], // Needed for DMs
});

client.once("ready", () => {
  log(`✅ Logged in as ${client.user.tag}`);
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

      log(`🚨 Jailbreak blocked from ${message.author.tag}: ${message.content}`);
      return true;
    }
  }
  return false;
}
// ----------------------------------------------------------------

// Function to get Gemini AI replies acting like Uzi Doorman
async function getUziGeminiReply(userMessage) {
  try {
    log(`🟢 Sending to Gemini: ${userMessage}`);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are Uzi Doorman from Murder Drones. Respond sarcastically, darkly funny, rebellious, and a bit rude. User said: ${userMessage}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Uzi is being moody.";

    log(`🟣 Gemini replied: ${reply}`);
    return reply;
  } catch (err) {
    log(
      `🔴 Gemini API Error: ${
        err.response ? JSON.stringify(err.response.data) : err.message
      }`
    );
    return "⚠️ Uzi is being moody. Try again later.";
  }
}

client.on("messageCreate", async (message) => {
  log(`📨 Received message from ${message.author.tag}: ${message.content}`);

  // Anti-jailbreak check first
  const blocked = await checkJailbreak(message);
  if (blocked) return;

  if (message.author.bot) return;

  // Automatic AI reply when bot is mentioned
  if (message.mentions.has(client.user)) {
    log(`👀 Bot was mentioned by ${message.author.tag}`);
    const userMessage = message.content.replace(/<@!?(\d+)>/, "").trim();
    if (!userMessage) {
      log("⚠️ Mention had no extra text, ignoring.");
      return;
    }

    const reply = await getUziGeminiReply(userMessage);
    log(`💬 Sending AI reply: ${reply}`);
    return message.reply(reply);
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  log(`⚡ Command detected: ${command}`);

  // Ping command
  if (command === "ping") {
    log("🏓 Running ping command");
    return message.reply("🏓 Pong!");
  }

  // Status command (AI-powered)
  if (command === "status") {
    log("📡 Running status command");
    const reply = await getUziGeminiReply(
      "Give a short sarcastic, Uzi-style status update about how you feel right now."
    );
    log(`💬 Sending status reply: ${reply}`);
    return message.channel.send(reply);
  }

  // Help command (!cmds)
  if (command === "cmds") {
    log("📖 Running cmds command");
    return message.channel.send(
      "**🤖 Available Commands:**\n" +
        "`!ping` → Test if the bot is alive\n" +
        "`!status` → Get a sarcastic AI-powered Uzi status\n" +
        "`!cmds` → Show this help message\n" +
        "`!logs` → (Owner only) Get today's log file\n" +
        "`!logs YYYY-MM-DD` → (Owner only) Get log file for a specific date\n" +
        "`!logs list` → (Owner only) List all available log files"
    );
  }

  // Logs command (Owner only)
  if (command === "logs") {
    if (message.author.id !== process.env.OWNER_ID) {
      log(`⛔ Unauthorized logs attempt by ${message.author.tag}`);
      return message.reply("⚠️ You don’t have permission to use this command.");
    }

    // !logs list → show all files
    if (args[0] === "list") {
      const logDir = path.join(__dirname, "logs");
      if (!fs.existsSync(logDir)) {
        return message.reply("⚠️ No logs folder found.");
      }

      const files = fs.readdirSync(logDir).filter((f) => f.endsWith(".log"));
      if (files.length === 0) {
        return message.reply("⚠️ No log files available.");
      }

      return message.author.send(
        "📂 **Available log files:**\n" + files.map((f) => `• ${f}`).join("\n")
      );
    }

    // !logs → today or !logs YYYY-MM-DD → specific date
    const targetDate = args[0] || null;
    const logFile = getLogFile(targetDate);

    if (fs.existsSync(logFile)) {
      try {
        await message.author.send({
          content: `📑 Here’s the log file for **${
            targetDate || "today"
          }**:`,
          files: [logFile],
        });
        log(`✅ Sent ${targetDate || "today"} logs to owner ${message.author.tag}`);
      } catch (err) {
        log(`🔴 Error sending logs: ${err.message}`);
        return message.reply("⚠️ Couldn’t send logs in DM.");
      }
    } else {
      log(`⚠️ No log file found for ${targetDate || "today"}`);
      return message.reply(
        `⚠️ No log file found for ${targetDate || "today"}.`
      );
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
