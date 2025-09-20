// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const http = require("http");

// --- Attempt to start server.js only if port is free ---
const PORT = 3000;

function startServer() {
  const serverModule = require("./server.js");
  console.log("🌐 Server.js loaded (server running or already active).");
  return serverModule;
}

// Simple port check
const net = require("net");
const tester = net.createServer()
  .once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${PORT} already in use. Connecting to existing server.js...`);
      startServer();
    } else {
      console.error(err);
    }
  })
  .once("listening", () => {
    tester.close();
    console.log("✅ Port free. Starting server.js...");
    startServer();
  })
  .listen(PORT);

// --- Local log function ---
function logEvent(message) {
  const time = new Date().toLocaleTimeString();
  const logMsg = `[${time}] ${message}`;
  console.log(logMsg);

  // Push to dashboard if addLog exists
  try {
    const serverModule = require("./server.js");
    if (serverModule.addLog) serverModule.addLog(logMsg);
  } catch (err) {
    // ignore if server.js not ready yet
  }

  return logMsg;
}

// --- Create bot client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Bot ready event ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  logEvent(`Bot logged in as ${client.user.tag}`);
});

// --- Commands ---
const PREFIX = "!";
const commands = {
  ping: {
    description: "Test if bot is alive",
    run: (msg) => msg.reply("🏓 Pong!"),
  },
  status: {
    description: "Show bot status",
    run: (msg) =>
      msg.reply(
        `✅ Online as ${client.user.tag}\n🌍 Servers: ${client.guilds.cache.size}`
      ),
  },
  cmds: {
    description: "Show all commands",
    run: (msg) => {
      let list = "**🤖 Commands:**\n";
      for (const [name, cmd] of Object.entries(commands)) {
        list += `\`!${name}\` → ${cmd.description}\n`;
      }
      msg.channel.send(list);
    },
  },
  logs: {
    description: "View logs (DM only)",
    run: (msg) => {
      msg.author.send("📂 Logs are available in the dashboard at /dashboard");
    },
  },
  dashboard: {
    description: "Link to dashboard",
    run: (msg) =>
      msg.reply("🌐 Open the bot dashboard: http://localhost:3000/dashboard"),
  },
};

// --- Message listener ---
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands[commandName];
  if (!command) return;

  try {
    command.run(message, args);
    logEvent(
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
