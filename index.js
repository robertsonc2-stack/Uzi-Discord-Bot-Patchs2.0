// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const serverSettingsModule = require("./serverSettings.js");
require("./server.js"); // start server automatically

const client = new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]
});

client.once("ready", ()=>console.log(`✅ Logged in as ${client.user.tag}`));

client.on("messageCreate", async message=>{
  if(message.author.bot || !message.guild) return;
  const guildId = message.guild.id;
  const settings = serverSettingsModule.getSettings(guildId);
  const prefix = settings.botPrefix || "!";

  if(!message.content.startsWith(prefix)) return;

  if(!serverSettingsModule.getAllowedUsers(guildId).includes(message.author.id)){
    console.log(`⚠️ Unauthorized user ${message.author.tag} tried a command.`);
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  console.log(`📥 Command from ${message.author.tag}: ${command}`);

  if(command==="status"){
    message.channel.send(`💬 Current status: ${settings.statusMessage}`);
  }

  if(command==="cmds"){
    message.channel.send(`**🤖 Commands:**\n\`${prefix}status\` → show status\n\`${prefix}cmds\` → list commands`);
  }
});

// Optional: update bot presence from status message
setInterval(()=>{
  client.guilds.cache.forEach(guild=>{
    const settings = serverSettingsModule.getSettings(guild.id);
    if(settings.statusMessage && client.user){
      client.user.setActivity(settings.statusMessage,{type:"WATCHING"}).catch(()=>{});
    }
  });
},10000);

client.login(process.env.DISCORD_TOKEN);
