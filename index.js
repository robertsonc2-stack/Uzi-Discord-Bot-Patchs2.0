require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverModule = require("./server.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "!";

// --- Logs helper ---
function logEvent(message) {
  console.log(message);
  serverModule.addLog(message);
  // Send to your DM
  const ownerId = process.env.OWNER_ID;
  if (ownerId && client.users.cache.has(ownerId)) {
    client.users.cache.get(ownerId).send(message).catch(()=>{});
  }
}

// --- Bot status update ---
function updateBotStatus() {
  if (!client.user) return;
  client.user.setActivity(serverModule.botSettings.statusMessage || "Online", { type: 3 }).catch(()=>{});
}
serverModule.setUpdateBotStatus(updateBotStatus);

// --- Commands ---
const commands = {
  cmds: {
    description: "Show all commands",
    execute: async (message) => {
      let cmdList = Object.keys(commands).map(cmd => `\`${PREFIX}${cmd}\` → ${commands[cmd].description}`).join("\n");
      message.channel.send(`**Available Commands:**\n${cmdList}`);
    }
  },
  ping: {
    description: "Ping the bot",
    execute: (message) => message.reply("🏓 Pong!")
  }
};

// --- Client ready ---
client.once("ready", () => {
  logEvent(`Bot logged in as ${client.user.tag}`);
  updateBotStatus();
});

// --- Message handler ---
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (commands[cmd]) {
    try { await commands[cmd].execute(message); } 
    catch (err) { message.reply("⚠️ Error executing command"); logEvent(`Command error: ${err}`); }
  }
});

// --- Login ---
client.login(process.env.DISCORD_TOKEN).catch(console.error);
