const { Client, GatewayIntentBits } = require("discord.js");
const server = require("./server");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Function to update bot status
function updateBotStatus() {
  if (!client.user) return;
  const statusMsg = server.botSettings.statusMessage || "Online";
  client.user.setActivity(statusMsg, { type: 3 }); // type 3 = WATCHING
  console.log(`Bot status updated to: ${statusMsg}`);
}

// Run bot ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Expose update function to server.js
server.setUpdateBotStatus(updateBotStatus);

// Login bot
client.login("MTQxMzg1MjQ5NTY4NzcxMjgxMg.G6XUyV.tQoP56YUEuBj_PiRZB9m9LyMXaE3orU1S8xY2o");
