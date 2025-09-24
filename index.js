// index.js
const { Client, GatewayIntentBits } = require("discord.js");
const { checkForUpdates, BOT_VERSION } = require("./updates");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const prefix = "!";

// ✅ Bot Ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ✅ Handle Commands
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !ping
  if (command === "ping") {
    return message.reply("🏓 Pong!");
  }

  // !status <new status>
  if (command === "status") {
    const newStatus = args.join(" ");
    if (!newStatus) return message.reply("⚠️ Please provide a status message.");
    client.user.setActivity(newStatus, { type: 0 }); // "PLAYING" type
    return message.reply(`✅ Status updated to: **${newStatus}**`);
  }

  // !cmds (list all commands)
  if (command === "cmds") {
    const commandsList = [
      "!ping - Replies with Pong!",
      "!status <text> - Change bot status",
      "!checkupdates - Check GitHub for updates",
      "!version - Show current bot version",
    ];
    return message.reply("📜 **Available Commands:**\n" + commandsList.join("\n"));
  }

  // !version
  if (command === "version") {
    return message.reply(`🤖 Current Bot Version: **${BOT_VERSION}**`);
  }

  // !checkupdates
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

// ✅ Login
client.login(process.env.BOT_TOKEN);
