const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ] 
});

// Load environment variables
const TOKEN = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// Create a collection to store commands
client.commands = new Collection();

// Load commands from commands directory
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Create commands directory if it doesn't exist
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
}

// Create basic commands
const basicCommands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
        execute: async (interaction) => {
            await interaction.reply('Pong!');
        }
    },
    {
        name: 'uzi',
        description: 'Roleplay as Uzi Doorman',
        execute: async (interaction) => {
            const responses = [
                "I'm Uzi Doorman, and I'm here to serve!",
                "Welcome to the MD base! I'm Uzi!",
                "Don't worry, I'm just a worker drone... or am I?",
                "System online. Uzi Doorman reporting for duty!"
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            await interaction.reply(response);
        }
    },
    {
        name: 'sdn',
        description: 'Roleplay as SD-N',
        execute: async (interaction) => {
            const responses = [
                "I am SD-N, disassembly drone at your service.",
                "Target acquired. Awaiting orders.",
                "System check complete. All weapons online.",
                "SD-N reporting. Ready for mission parameters."
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            await interaction.reply(response);
        }
    },
    {
        name: 'sdv',
        description: 'Roleplay as SD-V',
        execute: async (interaction) => {
            const responses = [
                "SD-V here. Ready to eliminate targets.",
                "Violence is my specialty. What's the mission?",
                "All systems operational. Targeting systems online.",
                "SD-V reporting. Awaiting combat orders."
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            await interaction.reply(response);
        }
    },
    {
        name: 'help',
        description: 'List all available commands',
        execute: async (interaction) => {
            const commandsList = [
                '/ping - Check if the bot is responsive',
                '/uzi - Get a response from Uzi Doorman',
                '/sdn - Get a response from SD-N',
                '/sdv - Get a response from SD-V',
                '/help - Show this help message'
            ];
            await interaction.reply(`**Available Commands:**\n${commandsList.join('\n')}`);
        }
    }
];

// Register slash commands when the bot is ready
client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Register slash commands
    try {
        const commands = basicCommands.map(cmd => ({
            name: cmd.name,
            description: cmd.description
        }));
        
        await client.application.commands.set(commands);
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = basicCommands.find(cmd => cmd.name === interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Handle message-based commands (legacy)
client.on('messageCreate', message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Handle prefix commands
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.reply('Pong!');
    } else if (command === 'uzi') {
        const responses = [
            "I'm Uzi Doorman, and I'm here to serve!",
            "Welcome to the MD base! I'm Uzi!",
            "Don't worry, I'm just a worker drone... or am I?",
            "System online. Uzi Doorman reporting for duty!"
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        message.reply(response);
    } else if (command === 'help') {
        message.reply('**Available Commands:**\n!ping - Check if the bot is responsive\n!uzi - Get a response from Uzi Doorman\n!help - Show this help message');
    }
});

// Handle bot joining new guilds
client.on(Events.GuildCreate, guild => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
});

// Handle errors
client.on(Events.Error, error => {
    console.error('Client error:', error);
});

// Login to Discord
if (TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('Please set your Discord bot token in the DISCORD_TOKEN environment variable');
    process.exit(1);
}

client.login(TOKEN).catch(error => {
    console.error('Login failed:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

module.exports = client;