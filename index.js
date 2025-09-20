const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Create a new client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Required to read message content
    ],
});

// Try to log in
client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error("❌ Failed to log in. Check your bot token in the .env file.");
    console.error(err);
    process.exit(1);
});

// When the bot is ready
client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

// Message handler
client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignore bot messages
    if (!message.content.startsWith('!')) return; // Commands start with "!"

    const args = message.content.slice(1).trim().split(/ +/);
