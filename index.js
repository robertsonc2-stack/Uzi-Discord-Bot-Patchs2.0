const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('❌ Please set your Discord bot token in the DISCORD_TOKEN environment variable');
    process.exit(1);
}

// Store commands
client.commands = new Collection();

// Load commands from "src/commands" (if any)
const commandsPath = path.join(__dirname, 'src', 'commands');
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[⚠️] Command at ${filePath} is missing "data" or "execute".`);
    }
}

// Built-in commands
const basicCommands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
        execute: async (interaction) => interaction.reply('Pong!')
    },
    {
        name: 'uzi',
        description: 'Roleplay as Uzi Doorman',
        responses: [
            "I'm Uzi Doorman, and I'm here to serve!",
            "Welcome to the MD base! I'm Uzi!",
            "Don't worry, I'm just a worker drone... or am I?",
            "System online. Uzi Doorman reporting for duty!"
        ]
    },
    {
        name: 'sdn',
        description: 'Roleplay as SD-N',
        responses: [
            "I am SD-N, disassembly drone at your service.",
            "Target acquired. Awaiting orders.",
            "System check complete. All weapons online.",
            "SD-N reporting. Ready for mission parameters."
        ]
    },
    {
        name: 'sdv',
        description: 'Roleplay as SD-V',
        responses: [
            "SD-V here. Ready to eliminate targets.",
            "Violence is my specialty. What's the mission?",
            "All systems operational. Targeting systems online.",
            "SD-V reporting. Awaiting combat orders."
        ]
    },
    {
        name: 'help',
        description: 'List all available commands',
        execute: async (interaction) => {
            const commandsList = basicCommands.map(c => `/${c.name} - ${c.description}`);
            await interaction.reply(`**Available Commands:**\n${commandsList.join('\n')}`);
        }
    }
];

// Register slash commands
client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
        const slashCommands = basicCommands.map(c => ({
            name: c.name,
            description: c.description
        }));
        await client.application.commands.set(slashCommands);
        console.log('✅ Slash commands registered');
    } catch (err) {
        console.error('❌ Error registering commands:', err);
    }
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = basicCommands.find(cmd => cmd.name === interaction.commandName);
    if (!command) return;

    try {
        if (command.execute) {
            await command.execute(interaction);
        } else if (command.responses) {
            const response = command.responses[Math.floor(Math.random() * command.responses.length)];
            await interaction.reply(response);
        }
    } catch (err) {
        console.error(`❌ Error executing ${interaction.commandName}:`, err);
        if (!interaction.replied) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Handle legacy prefix commands (!)
client.on('messageCreate', message => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'ping') {
        message.reply('Pong!');
    } else if (cmd === 'uzi') {
        const responses = basicCommands.find(c => c.name === 'uzi').responses;
        message.reply(responses[Math.floor(Math.random() * responses.length)]);
    } else if (cmd === 'help') {
        const commandsList = basicCommands.map(c => `!${c.name} - ${c.description}`);
        message.reply(`**Available Commands:**\n${commandsList.join('\n')}`);
    }
});

// Log new guild joins
client.on(Events.GuildCreate, guild => {
    console.log(`📥 Joined new guild: ${guild.name} (${guild.id})`);
});

// Error handling
client.on('error', err => console.error('❌ Client error:', err));

// Login
client.login(TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down (SIGINT)...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down (SIGTERM)...');
    client.destroy();
    process.exit(0);
});

module.exports = client;
