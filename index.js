    const { Client, GatewayIntentBits } = require('discord.js');
    require('dotenv').config(); // If using dotenv
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent, // Required to read message content
        ],
    });
    client.login(process.env.DISCORD_BOT_TOKEN); // If using dotenv
    // Or directly: client.login('YOUR_BOT_TOKEN_HERE');
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', message => {
        if (message.author.bot) return; // Ignore messages from other bots

        if (message.content === '!ping') {
            message.reply('Pong!');
        }
    });


