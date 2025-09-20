// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverSettings = require("./serverSettings");
const net = require("net");

// --- Discord Owner ID (your user) ---
const OWNER_ID = "YOUR_USER_ID_HERE"; // ← change this to your Discord ID

// --- Check if server is already running before starting ---
const PORT = 3000;
function startServer() {
  try {
    require("./server.js"); // will only start server once
    console.log("🌐 Server.js loaded (server running or already active).");
  } catch (err) {
    console.error("❌ Failed to load server.js:", err);
  }
}

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

// --- Create bot client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Log function sending DMs to you ---
async function logEvent(message) {
  const time = new Date().toLocaleTimeString();
  const logMsg = `[${time}] ${message}`;
  console.log(logMsg);

  try {
    if (client.isReady()) {
      const owner = await client.users.fetch(OWNER_ID);
      if (owner) owner.send(`📩 ${logMsg}`).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to send log DM:", err);
  }

  return logMsg;
}

// --- Bot ready event ---
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await logEvent(`Bot logged in as ${client.user.tag}`);

  // Set initial status
  const settings = serverSettings.getSettings("global");
  if (settings.statusMessage) {
    try {
      client.user.setActivity(settings.statusMessage, { type: 3 });
    } catch (err) {
      console.error("Failed to set bot activity:", err);
    }
  }

  // Optional: dynamic status updates
  setInterval(() => {
    const newSettings = serverSettings.getSettings("global");
    if (
      newSettings.statusMessage &&
      client.user.presence.activities[0]?.name !== newSettings.statusMessage
    ) {
      try {
        client.user.setActivity(newSettings.statusMessage, { type: 3 });
        logEvent(`Bot status updated to: ${newSettings.statusMessage}`);
      } catch (err) {
        console.error("Failed to update bot activity:", err);
      }
    }
  }, 5000);
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
      msg.author.send("📂 Logs are available in your DMs automatically.");
    },
  },
  dashboard: {
    description: "Link to dashboard",
    run: (msg) =>
      msg.reply("🌐 Open the bot dashboard: http://localhost:3000/dashboard"),
  },
};

// --- Message listener ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands[commandName];
  if (!command) return;

  try {
    await command.run(message, args);
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
