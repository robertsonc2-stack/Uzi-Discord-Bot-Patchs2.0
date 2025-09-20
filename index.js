// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const PREFIX = "!";

// ------------------ LOGGER ------------------
function getLogFile(date = null) {
  const targetDate = date || new Date().toISOString().split("T")[0];
  return path.join(__dirname, "logs", `${targetDate}.log`);
}

function log(message) {
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  console.log(message);
  fs.appendFileSync(getLogFile(), logMessage, "utf8");
}

// ------------------ START SERVER.JS ONCE ------------------
const serverPath = path.join(__dirname, "server.js");
const portCheck = process.env.PORT || 3000;

function isPortAvailable(port, callback) {
  const tester = http.createServer()
    .once("error", () => callback(false))
    .once("listening", () => tester.once("close", () => callback(true)).close())
    .listen(port);
}

isPortAvailable(portCheck, (available) => {
  if (!available) {
    log(`⚠️ Port ${portCheck} is already in use. Skipping server start.`);
  } else {
    log(`🚀 Starting server.js on port ${portCheck}...`);
    const serverProcess = spawn("node", [serverPath], { shell: true });

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      process.stdout.write(`[Server] ${msg}`);
    });

    serverProcess.stderr.on("data", (data) => {
      process.stderr.write(`[Server ERROR] ${data.toString()}`);
    });

    serverProcess.on("close", (code) => {
      log(`⚠️ server.js exited with code ${code}`);
    });

    serverProcess.on("error", (err) => log(`🔴 Failed to start server.js: ${err.message}`));

    // If bot crashes, stop server
    function cleanup() {
      log("🛑 Discord bot exited, stopping server.js...");
      serverProcess.kill();
      process.exit();
    }
    process.on("exit", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("uncaughtException", (err) => {
      log(`🔴 Uncaught Exception: ${err.message}`);
      cleanup();
    });
  }

  // Start bot regardless of port availability
  startBot();
});

// ------------------ START DISCORD BOT ------------------
function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: ["CHANNEL"],
  });

  client.once("ready", () => log(`✅ Logged in as ${client.user.tag}`));

  // ------------------ ANTI-JAILBREAK ------------------
  const jailbreakPatterns = [/ignore previous instructions/i, /jailbreak/i, /bypass filters/i];

  async function checkJailbreak(message) {
    if (!message.content) return false;
    for (const pattern of jailbreakPatterns) {
      if (pattern.test(message.content)) {
        try { await message.delete(); } catch {}
        try { await message.author.send("⚠️ Your message was blocked for attempting to bypass safety."); } catch {}
        log(`🚨 Jailbreak blocked from ${message.author.tag}: ${message.content}`);
        return true;
      }
    }
    return false;
  }

  // ------------------ AI REPLY ------------------
  async function getUziGeminiReply(userMessage) {
    try {
      log(`🟢 Sending to Gemini: ${userMessage}`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ role: "user", parts: [{ text: `You are Uzi Doorman. Be sarcastic, darkly funny, rebellious. User said: ${userMessage}` }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Uzi is being moody.";
      log(`🟣 Gemini replied: ${reply}`);
      return reply;
    } catch (err) {
      log(`🔴 Gemini API Error: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
      return "⚠️ Uzi is being moody. Try again later.";
    }
  }

  // ------------------ MESSAGE EVENT ------------------
  client.on("messageCreate", async (message) => {
    if (await checkJailbreak(message)) return;
    if (message.author.bot) return;

    const isCommand = message.content.startsWith(PREFIX);
    const isMentioned = message.mentions.has(client.user);

    // Only log commands or mentions
    if (isCommand || isMentioned) {
      log(`📨 Message from ${message.author.tag}: ${message.content}`);
    }

    // AI reply when mentioned
    if (isMentioned) {
      const userMessage = message.content.replace(/<@!?(\d+)>/, "").trim();
      if (!userMessage) return;
      const reply = await getUziGeminiReply(userMessage);
      return message.reply(reply);
    }

    if (!isCommand) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    log(`⚡ Command: ${command}`);

    if (command === "ping") return message.reply("🏓 Pong!");
    if (command === "status") {
      const reply = await getUziGeminiReply("Give a short sarcastic Uzi-style status update.");
      return message.channel.send(reply);
    }

    if (command === "cmds") {
      return message.channel.send(
        "**🤖 Commands:**\n" +
          "`!ping` → Test bot\n" +
          "`!status` → Get Uzi AI status\n" +
          "`!cmds` → Show this help\n" +
          "`!logs` → (Owner only) Get logs\n" +
          "`!logs YYYY-MM-DD` → (Owner only) Specific date\n" +
          "`!logs list` → (Owner only) List log files"
      );
    }

    if (command === "logs") {
      if (message.author.id !== process.env.OWNER_ID) return message.reply("⚠️ You don’t have permission.");
      if (args[0] === "list") {
        const logDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logDir)) return message.reply("⚠️ No logs folder.");
        const files = fs.readdirSync(logDir).filter(f => f.endsWith(".log"));
        return message.author.send("📂 Logs:\n" + files.join("\n"));
      }
      const targetDate = args[0] || null;
      const logFile = getLogFile(targetDate);
      if (fs.existsSync(logFile)) {
        return message.author.send({ content: `📑 Logs for ${targetDate || "today"}`, files: [logFile] });
      } else return message.reply(`⚠️ No log file for ${targetDate || "today"}`);
    }
  });

  client.login(process.env.DISCORD_TOKEN).catch(err => log(`🔴 Discord bot failed to login: ${err.message}`));
}
