require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Function to get AI reply as Uzi Doorman
async function getUziReply(userMessage) {
  const prompt = `
You are Uzi Doorman from Murder Drones. You are sarcastic, rebellious, confident, and have dark humor. 
Reply to the user's message as Uzi would, in-character. Keep it short and snarky. 
User said: "${userMessage}"
Uzi reply:
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are Uzi Doorman from Murder Drones. Stay in character." },
      { role: "user", content: userMessage },
    ],
    temperature: 0.8,
    max_tokens: 100,
  });

  return response.choices[0].message.content.trim();
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "uzi") {
    const userMessage = args.join(" ");
    if (!userMessage) {
      return message.channel.send(
        "😒 Uzi: 'What do you want me to say? Make it quick.'"
      );
    }

    try {
      const reply = await getUziReply(userMessage);
      return message.channel.send(reply);
    } catch (err) {
      console.error(err);
      return message.channel.send(
        "⚠️ Uzi is too busy being sarcastic right now. Try again."
      );
    }
  }

  if (command === "ping") {
    return message.reply("🏓 Pong!");
  }

  if (command === "hello") {
    return message.reply(`Hello, ${message.author.username}! 👋`);
  }
});

client.login(process.env.DISCORD_TOKEN);

