// index.js
const { Client, GatewayIntentBits } = require("discord.js");

const PREFIX = "!";
const TOKEN = "MTQxMzg1MjQ5NTY4NzcxMjgxMg.Gvi5tH.T-hI7yAaPm138R04YvKKBpn7hTnpPosHPOEZOQ";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Uzi Doorman roleplay
  if (command === "uzi") {
    const userMessage = args.join(" ");

    // Pre-written Uzi-style personality responses
    const uziResponses = [
      `😒 Uzi: "Wow, ${message.author.username}, *that’s* what you came up with? Groundbreaking."`,
      `😈 Uzi: "Oh great, another genius idea. Should I start sarcastically clapping now or later?"`,
      `💀 Uzi: "Honestly? I’d rather fight a hundred murder drones than deal with this nonsense."`,
      `🙄 Uzi: "Yeah, sure, because *that’s* gonna end well..."`,
      `😏 Uzi: "Classic. Just another day of me saving everyone while you all stand around."`,
      `🛠️ Uzi: "You want me to respond to '${userMessage}'? Fine. Here’s my response: NO."`,
      `🔫 Uzi: "Let’s cut to the chase—this is dumb, and I hate it. Moving on."`,
    ];

    // If user typed something, she’ll sass them about it
    if (userMessage) {
      uziResponses.push(
        `😎 Uzi: "‘${userMessage}’? Seriously? That’s your big plan? Ugh."`
      );
    }

    const reply = uziResponses[Math.floor(Math.random() * uziResponses.length)];
    return message.channel.send(reply);
  }
});

client.login(TOKEN);


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Uzi Doorman roleplay
  if (command === "uzi") {
    const userMessage = args.join(" ");

    // Pre-written Uzi-style personality responses
    const uziResponses = [
      `😒 Uzi: "Wow, ${message.author.username}, *that’s* what you came up with? Groundbreaking."`,
      `😈 Uzi: "Oh great, another genius idea. Should I start sarcastically clapping now or later?"`,
      `💀 Uzi: "Honestly? I’d rather fight a hundred murder drones than deal with this nonsense."`,
      `🙄 Uzi: "Yeah, sure, because *that’s* gonna end well..."`,
      `😏 Uzi: "Classic. Just another day of me saving everyone while you all stand around."`,
      `🛠️ Uzi: "You want me to respond to '${userMessage}'? Fine. Here’s my response: NO."`,
      `🔫 Uzi: "Let’s cut to the chase—this is dumb, and I hate it. Moving on."`,
    ];

    // If user typed something, she’ll sass them about it
    if (userMessage) {
      uziResponses.push(
        `😎 Uzi: "‘${userMessage}’? Seriously? That’s your big plan? Ugh."`
      );
    }

    const reply = uziResponses[Math.floor(Math.random() * uziResponses.length)];
    return message.channel.send(reply);
  }
});

client.login(TOKEN);

