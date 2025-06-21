# WoW Discord Bot

A Discord bot built with discord.js that integrates with a custom [WoW API SDK](https://www.npmjs.com/package/wow-api-sdk?activeTab=readme) to fetch and display World of Warcraft character information via slash commands.
Get instant info about your WoW characters right inside Discord — including profile, item level, active specialization, mounts, and achievements.

## Features

- Slash command `/wow` to query character data by name, realm, and region
- Displays character portrait, item level, active specialization, latest achievement, and mount count in a rich embed
- Built with modular code using a [WoW API SDK](https://www.npmjs.com/package/wow-api-sdk?activeTab=readme) for easy API integration
- Robust error handling with informative user feedback
- Supports multiple WoW regions (eu, us, etc.)

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/AProd18/wow-discord-bot.git
cd wow-discord-bot
npm install
```

## Configuration

Create a .env file in the root directory with your Discord and Blizzard API credentials:

```jsx
DISCORD_TOKEN = your_discord_bot_token;
CLIENT_ID = your_discord_client_id;
BLIZZARD_CLIENT_ID = your_blizzard_client_id;
BLIZZARD_CLIENT_SECRET = your_blizzard_client_secret;
```

## Quick Start

Run the bot locally:

```bash
node deploy-commands.js  # register slash commands globally or per guild
node index.js           # start the bot

```

Use the slash command in Discord:

```bash
/wow name:<character_name> realm:<realm_name> region:<region>

```

## Example Output

The bot replies with an embed including:

- Character avatar
- Character name, level, and class
- Item level
- Active specialization
- Number of mounts collected
- Latest achievement earned
- Realm and region footer

## How it works

- The bot uses slash commands via Discord API (discord.js v14+)
- Calls the WoW API SDK to fetch character data from Blizzard API
- SDK manages OAuth token retrieval and caching
- Data is formatted into Discord embeds and sent as responses

## Available Slash Command Options

| Option   | Description              | Required |
| -------- | ------------------------ | -------- |
| `name`   | Character name           | Yes      |
| `realm`  | Character realm          | Yes      |
| `region` | WoW region (e.g. eu, us) | Yes      |
