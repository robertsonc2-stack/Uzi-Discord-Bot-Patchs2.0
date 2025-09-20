// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// Import server settings module
const serverSettingsModule = require('./server.js');

const PREFIX_DEFAULT = "!";
const OWNER_ID = process.env.OWNER_ID;

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

// ------------------ CLEANUP OLD LOGS ------------------
function cleanupOldLogs(days = 7) {
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) return;

  const files = fs.readdirSync(logDir);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    if (!file.endsWith(".log")) return;
    const filePath = path.join(logDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtime.getTime() < cutoff) {
      fs.unlinkSync(filePath);
      log(`🗑️ Deleted old log file: ${file}`);
    }
  });
}

// Run cleanup on start
cleanupOldLogs(7);

// ------------------ START SERVER.JS ------------------
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
      const msg = data.toString().trim();
      if (msg) log(`[Server] ${msg}`);
    });

    serverProcess.stderr.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg) log(`[Server ERROR] ${msg}`);
    });

    serverProcess.on("close", (code) => log(`⚠️ server.js exited with code ${code}`));
    serverProcess.on("error", (err) => log(`🔴 Failed to start server.js: ${err.message}`));

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

  startBotWithLimitedRestarts();
});

// ------------------ DISCORD BOT ------------------
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
    if (message.author.bot) return;
    if (await checkJailbreak(message)) return;

    const guildId = message.guild?.id;
    const guildSettings = serverSettingsModule.getSettings(guildId) || {};
    const botPrefix = guildSettings.botPrefix || PREFIX_DEFAULT;
    const statusMessage = guildSettings.statusMessage || "Uzi is online";

    const isCommand = message.content.startsWith(botPrefix);
    const isMentioned = message.mentions.has(client.user);

    if (isCommand || isMentioned) log(`📨 Message from ${message.author.tag}: ${message.content}`);

    // Mention -> AI reply
    if (isMentioned) {
      const userMessage = message.content.replace(/<@!?(\d+)>/, "").trim();
      if (!userMessage) return;
      const reply = await getUziGeminiReply(userMessage);
      return message.reply(reply);
    }

    if (!isCommand) return;

    const args = message.content.slice(botPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "ping") return message.reply("🏓 Pong!");
    if (command === "status") return message.channel.send(statusMessage);

    if (command === "cmds") {
      return message.channel.send(
        `**🤖 Commands (Prefix: ${botPrefix}):**\n` +
        "`!ping` → Test bot\n" +
        "`!status` → Get Uzi AI status\n" +
        "`!cmds` → Show this help\n" +
        "`!logs` → (Owner only) Get logs\n" +
        "`!Dashboard` → (Owner only) Open server dashboard"
      );
    }

    // ------------------ DASHBOARD COMMAND ------------------
    if (command === "dashboard") {
      if (message.author.id !== OWNER_ID) {
        return message.reply("⚠️ You don’t have permission to view the dashboard.");
      }

      if (!guildId) return message.reply("⚠️ Cannot determine server ID.");

      const dashboardURL = `http://localhost:${process.env.PORT || 3000}/?guildId=${guildId}`;

      try {
        await message.author.send(`🔧 Server Dashboard for **${message.guild.name}**:\n${dashboardURL}`);
        return message.reply("✅ Dashboard link sent to your DMs!");
      } catch (err) {
        log(`🔴 Failed to send dashboard DM: ${err.message}`);
        return message.reply("⚠️ Failed to send you the dashboard link. Do you have DMs disabled?");
      }
    }

    // ------------------ OWNER LOGS COMMAND ------------------
    if (command === "logs") {
      if (message.author.id !== OWNER_ID) return message.reply("⚠️ You don’t have permission.");
      const arg = args[0];
      const logDir = path.join(__dirname, "logs");

      if (arg === "list") {
        if (!fs.existsSync(logDir)) return message.author.send("⚠️ No logs folder.");
        const files = fs.readdirSync(logDir).filter(f => f.endsWith(".log"));
        return message.author.send("📂 Logs:\n" + files.join("\n"));
      }

      const logFile = getLogFile(arg);
      if (fs.existsSync(logFile)) {
        return message.author.send({ content: `📑 Logs for ${arg || "today"}`, files: [logFile] });
      } else return message.reply(`⚠️ No log file for ${arg || "today"}`);
    }
  });

  client.login(process.env.DISCORD_TOKEN).catch(err => { throw err; });
}

// ------------------ AUTO-RESTART BOT ------------------
function startBotWithLimitedRestarts() {
  let restartCount = 0;

  async function launchBot() {
    const mainGuildSettings = serverSettingsModule.getSettings(/* choose main guild */) || {};
    const maxRestarts = mainGuildSettings.maxRestarts || 2;

    try { await startBot(); } catch (err) { log(`🔴 Bot crashed: ${err.message}`); }

    restartCount++;
    if (restartCount <= maxRestarts) {
      log(`♻️ Restarting Discord bot (${restartCount}/${maxRestarts}) in 5 seconds...`);
      setTimeout(launchBot, 5000);
    } else {
      log("❌ Bot exceeded max restarts. Shutting down index.js and server.js...");
      process.exit(1);
    }
  }

  launchBot();
}
