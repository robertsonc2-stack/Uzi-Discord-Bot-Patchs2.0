// index.js
const { Client, GatewayIntentBits } = require("discord.js");
const { checkForUpdates, BOT_VERSION } = require("./updates");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const prefix = "!";

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 🔹 New checkupdates command
  if (command === "checkupdates") {
    const update = await checkForUpdates();

    if (update.error) {
      return message.reply(`⚠️ Failed to check updates: ${update.error}`);
    }

    if (update.upToDate) {
      message.reply(`✅ Bot is up to date!\nCurrent Version: **${update.current}**`);
    } else {
      message.reply(
        `⚠️ Update available!\nCurrent: **${update.current}**\nLatest: **${update.latest}**\nDownload: ${update.url}`
      );
    }
  }
});

client.login(process.env.BOT_TOKEN);
