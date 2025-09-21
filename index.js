require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverModule = require("./server.js"); // plain HTTP server

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Helper to log events
function logEvent(message) {
    console.log(message);
    serverModule.addLog?.(message); // safely call addLog if it exists
}

// Update bot status from server settings
function updateBotStatus() {
    if (client.user) {
        const status = serverModule.botSettings.statusMessage || "Online";
        client.user.setActivity(status, { type: "WATCHING" });
        logEvent(`Bot status updated: ${status}`);
    }
}

client.once("ready", () => {
    logEvent(`Bot logged in as ${client.user.tag}`);
    updateBotStatus();

    // Optional: Refresh status every 30 seconds in case dashboard changes it
    setInterval(updateBotStatus, 30000);
});

// Command handler
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefix = serverModule.botSettings.prefix || "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "cmds") {
        // Send list of commands
        const commands = [
            `${prefix}cmds → List commands`,
            `${prefix}status → Show current bot status`
        ];
        message.author.send("📜 Commands:\n" + commands.join("\n"));
        logEvent(`Sent commands to ${message.author.tag}`);
    }

    if (command === "status") {
        message.reply(`🤖 Current bot status: "${serverModule.botSettings.statusMessage}"`);
        logEvent(`${message.author.tag} checked bot status`);
    }
});

// Log all messages mentioning the bot
client.on("messageCreate", (message) => {
    if (message.mentions.has(client.user)) {
        logEvent(`Mention from ${message.author.tag}: ${message.content}`);
    }
});

client.login(process.env.DISCORD_TOKEN);

