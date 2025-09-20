require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Function to get AI reply as Uzi Doorman
async function getUziReply(messageContent) {
  const prompt = `
You are Uzi Doorman from Murder Drones. You are sarcastic, rebellious, confident, and have dark humor. 
Reply to the user's message as Uzi would, in-character. Keep it short and snarky. 
User said: "${messageContent}"
Uzi reply:
`;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 60,
    temperature: 0.8,
  });

  return response.data.choices[0].text.trim();
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
