require('./main');  // Load your main bot functionality
require('./shiva');  // Load Shiva (your custom core logic)

const path = require('path');
const express = require("express");
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');  // Import the configuration file
const app = express();
const port = 8888;

// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Initialize collection to hold commands
client.commands = new Collection();

// Dynamically load all command files from the "commands" folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = require('fs').readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load commands into the bot
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.name, command);
}

// Express route to serve the HTML page (index.html)
app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');  // Assuming you have an index.html file
    res.sendFile(imagePath);
});

// Start Express server
app.listen(port, () => {
    console.log(`🔗 Listening to Luffy : http://localhost:${port}`);
});

// Handle incoming messages and process commands
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;  // Ignore bot messages
    if (!message.content.startsWith(config.bot.prefix)) return;  // Check if the message starts with the bot prefix

    const args = message.content.slice(config.bot.prefix.length).trim().split(/ +/);  // Get arguments from the message
    const commandName = args.shift().toLowerCase();  // Get the command name

    const command = client.commands.get(commandName) || client.commands.get(client.commands.aliases.get(commandName));  // Check if the command exists
    if (!command) return;

    try {
        await command.execute(message, args, client);  // Execute the command
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply('There was an error trying to execute that command!');
    }
});

// Log the bot in using the token from the config file
client.login(config.discord.token);
