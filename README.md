# Uzi-Discord-Bot

WARNING THIS README FILE IS NOT UP TO DATE DO NOT USE THSI BOT OR THE BOT YOU MAKE

A Discord bot featuring a character from Murder Drones Called Uzi Doorman for roleplay interactions.

## Features

- **Slash Commands**: Modern Discord interactions with !commands
- **Roleplay Character**: Uzi Doorman with unique personalities
- **Web Dashboard**: Simple web interface to view bot status
- **Multiple Response Types**: Each character has unique response pools
- **Easy Setup**: Simple configuration with environment variables

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/coltonsr77/Uzi-Discord-Bot.git
cd Uzi-Discord-Bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Discord bot token and client ID

```bash
cp .env.example .env
```

Edit `.env` file:
```
DISCORD_TOKEN=your_actual_bot_token_here
CLIENT_ID=your_actual_client_id_here
Not Needed Only For bots That Needs This
OPENAI_API_KEY=
```

### 4. Get Your Discord Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token and paste it in `.env`
5. Enable the following intents:
   - Server Members Intent
   - Message Content Intent

### 5. Invite the Bot to Your Server
Use this URL format (replace YOUR_CLIENT_ID):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 6. Run the Bot

#### Option A: Run both bot and web server
```bash
node index.js
```

#### Option B: Run only the Discord bot
```bash
npm run bot
```

#### Option C: Run in development mode (both services)
```bash
npm run dev
```

## Available Commands

### Slash Commands
- `!ping` - Check if the bot is responsive
- `!uzi` - Get a response from Uzi Doorman
- `/help` - Show all available commands (NOT MADE YET)

### Legacy Commands (prefix: !)
- `!ping` - Check if the bot is responsive
- `!uzi` - Get a response from Uzi Doorman
- `!help` - Show available commands (NOT MADE YET)

## Character Personalities

### Uzi Doorman
A worker drone with a mysterious past, often questioning her existence and showing determination.

## Web Dashboard
Access the web dashboard at `http://localhost:3000` when running the server. The dashboard shows:
- Bot status
- Available commands
- Character information

## Troubleshooting

### Bot not responding?
1. Check if the bot token is correctly set in `.env`
2. Verify the bot has necessary permissions in your server
3. Check console for error messages

### Commands not appearing?
1. It may take up to 1 hour for slash commands to register globally
2. For faster testing, use guild-specific commands (see Discord.js docs)

### Web server not starting?
1. Check if port 3000 is already in use
2. Verify all dependencies are installed with `npm install`

## Contributing
Feel free to submit issues or pull requests to improve the bot!

## License
MIT License - feel free to use and modify as needed.
