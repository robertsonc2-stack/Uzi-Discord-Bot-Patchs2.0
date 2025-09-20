// index.js
const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

// token check
const TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN not set. Put "DISCORD_BOT_TOKEN=your_token" in .env or set the env var.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // privileged intent for message content
    GatewayIntentBits.DirectMessages, // if you want to receive DMs
  ],
  partials: [Partials.Channel], // helps messages from DM channels
});

client.once('ready', () => {
  console.log(`✅ Bot ready — logged in as ${client.user.tag}`);
});

client.on('error', (err) => {
  console.error('Client error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

client.on('messageCreate', (message) => {
  if (message.author?.bot) return; // ignore bots
  // command prefix '!'
  if (!message.content || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  try {
    if (command === 'ping') return message.reply('🏓 Pong!');
    if (command === 'hello') return message.reply(`👋 Hello, ${message.author.username}!`);
    return message.reply('❓ Unknown command. Try `!ping` or `!hello`.');
  } catch (err) {
    console.error('Error in messageCreate handler:', err);
    return message.reply('⚠️ Oops — something went wrong while handling your command.');
  }
});

client.login(TOKEN)
  .then(() => console.log('✅ Login successful'))
  .catch(err => {
    console.error('❌ Login failed — check token and network. Error follows:');
    console.error(err);
    process.exit(1);
  });

