const { Client, GatewayIntentBits } = require("discord.js");
const serverSettings = require("./serverSettings.js");
const { logMessage, getCommands } = require("./shared.js");

require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;
const OWNER_ID = process.env.OWNER_ID || "123456789012345678"; // replace with your ID

// --- Command definitions ---
const commands = {
  cmds: {
    description: "List all commands",
    execute: (message) => {
      const allCommands = Object.entries(commands)
        .map(([cmd, info]) => `**!${cmd}** — ${info.description}`)
        .join("\n");
      message.reply("📜 **Available Commands:**\n" + allCommands);
      logMessage(`📜 ${message.author.tag} used !cmds`);
    }
  },
  dashboard: {
    description: "Get link to the bot dashboard",
    execute: (message) => {
      const url = `http://localhost:3000/dashboard?userId=${message.author.id}&guildId=${message.guild.id}`;
      message.reply(`🌐 Open the dashboard here: ${url}`);
      logMessage(`🌐 ${message.author.tag} accessed the dashboard`);
    }
  },
  logs: {
    description: "Show recent logs (owner only)",
    execute: (message) => {
      if (message.author.id !== OWNER_ID) {
        return message.reply("❌ You are not authorized to view logs.");
      }
      const logs = require("./shared.js").getLogs().slice(-10).join("\n");
      message.reply("📝 **Recent Logs:**\n" + (logs || "No logs yet."));
      logMessage(`📝 ${message.author.tag} accessed logs`);
    }
  },
  status: {
    description: "Check bot status",
    execute: (message) => {
      message.reply(`✅ Bot is running as **${client.user.tag}**`);
      logMessage(`✅ ${message.author.tag} checked status`);
    }
  }
};

// --- AI Response Hook ---
async function aiReply(prompt) {
  // 🔹 Replace this with Google AI API call later
  return `🤖 AI says: "${prompt}" (placeholder reply)`;
}

// --- Bot Events ---
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  logMessage(`✅ Bot started as ${client.user.tag}`);

  // Set status per guild
  setInterval(() => {
    client.guilds.cache.forEach((guild) => {
      const settings = serverSettings.getSettings(guild.id);
      client.user.setActivity(settings.statusMessage, { type: 3 }).catch(() => {});
    });
  }, 60000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const settings = serverSettings.getSettings(message.guild?.id || "default");
  const prefix = settings.botPrefix || "!";

  // --- Command Handling ---
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (commands[commandName]) {
      try {
        await commands[commandName].execute(message, args);
      } catch (err) {
        console.error(err);
        message.reply("❌ Error executing command.");
      }
    }
    return;
  }

  // --- Mention Reply w/ AI ---
  if (message.mentions.has(client.user)) {
    const userPrompt = message.content.replace(/<@!?\\d+>/, "").trim();
    const reply = await aiReply(userPrompt || "Hello!");
    message.reply(reply);
    logMessage(`💬 AI replied to ${message.author.tag}`);
  }
});

// --- Expose commands to server.js ---
module.exports = { client, commands };

// --- Start Bot ---
client.login(TOKEN).catch((err) => {
  console.error("❌ Failed to login:", err);
  process.exit(1);
});
