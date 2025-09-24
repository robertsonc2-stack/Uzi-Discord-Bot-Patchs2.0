require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
const server = require("./server.js");

const BOT_VERSION = process.env.BOT_VERSION || "1.0.2";
const GITHUB_REPO = process.env.GITHUB_REPO || "yourusername/yourrepo";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function logEvent(message) {
  console.log(message);
  if (server.addLog) {
    server.addLog(`[${new Date().toLocaleString()}] ${message}`);
  }
}

client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag} (ID: ${process.env.DISCORD_CLIENT_ID})`);
});

// --- Function to check GitHub updates ---
async function checkForUpdates() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    const data = await res.json();

    if (data.tag_name) {
      if (data.tag_name === BOT_VERSION) {
        return { upToDate: true, current: BOT_VERSION, latest: data.tag_name, url: data.html_url };
      } else {
        return { upToDate: false, current: BOT_VERSION, latest: data.tag_name, url: data.html_url };
      }
    }
    return { error: true, current: BOT_VERSION };
  } catch (err) {
    console.error(err);
    return { error: true, current: BOT_VERSION };
  }
}

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!")) return;

  const command = message.content.slice(1).toLowerCase();

  if (command === "cmds") {
    message.reply(
      "**Available Commands:**\n" +
      "`!cmds` - Show this list\n" +
      "`!updatecheck` - Check for bot updates\n" +
      "`!dashboard` - Open the dashboard\n" +
      "`!log` - Show recent logs"
    );
  }

  else if (command === "updatecheck") {
    const updateInfo = await checkForUpdates();

    if (updateInfo.error) {
      message.reply(`ℹ️ Could not fetch updates. You are on version **${updateInfo.current}**`);
    } else if (updateInfo.upToDate) {
      message.reply(`✅ You are up-to-date! Current version: **${updateInfo.current}**`);
    } else {
      message.reply(`⚠️ Update available!\nCurrent: **${updateInfo.current}**\nLatest: **${updateInfo.latest}**\n\nGet it here: ${updateInfo.url}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// Expose update check to server.js so dashboard can use it
module.exports = { checkForUpdates, BOT_VERSION };

