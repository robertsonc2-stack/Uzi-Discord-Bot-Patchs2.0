// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { spawn } = require("child_process");
const serverSettings = require("./serverSettings");
const { logEvent } = require("./shared");

// --- Start server.js before bot ---
const server = spawn("node", ["server.js"], { stdio: "inherit" });
server.on("error", (err) => console.error("❌ Failed to start server.js:", err));

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

  // Apply initial status
  const settings = serverSettings.getSettings("global");
  if (settings.statusMessage) {
    try {
      client.user.setActivity(settings.statusMessage, { type: 3 });
    } catch (err) {
      console.error("Failed to set bot activity:", err);
    }
  }

  // Watch for settings changes dynamically
  setInterval(() => {
    const newSettings = serverSettings.getSettings("global");
    if (
      newSettings.statusMessage &&
      client.user.presence.activities[0]?.name !== newSettings.statusMessage
    ) {
      try {
        client.user.setActivity(newSettings.statusMessage, { type: 3 });
        console.log("🔄 Bot status updated to:", newSettings.statusMessage);
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
      msg.author.send("📂 Logs are available in the dashboard at /logs");
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

  // Only allow commands with prefix
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

