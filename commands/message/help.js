const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'List all available commands',
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(message, args, client) {
        // Ensure core validation
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;

        try {
            // Load message commands from the 'message' folder
            const msgCommandsPath = path.join(__dirname, '..', 'message');
            const msgFiles = fs.readdirSync(msgCommandsPath).filter(file => file.endsWith('.js'));
            const messageCommands = msgFiles.map(file => {
                const cmd = require(path.join(msgCommandsPath, file));
                return { name: cmd.name || 'Unknown', description: cmd.description || 'No description' };
            });

            // Load slash commands from the 'slash' folder
            const slashCommandsPath = path.join(__dirname, '..', 'slash');
            const slashFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

            const slashCommands = slashFiles.map(file => {
                try {
                    const cmd = require(path.join(slashCommandsPath, file));
                    
                    // Validate that the 'data' object exists and contains 'name' and 'description'
                    if (!cmd.data || !cmd.data.name || !cmd.data.description) {
                        console.warn(`Invalid slash command file (missing name/description): ${file}`);
                        return null;  // Skip invalid command
                    }

                    return {
                        name: cmd.data.name,
                        description: cmd.data.description
                    };
                } catch (err) {
                    console.error(`Error loading slash command file ${file}:`, err);
                    return null;  // Skip the file if there is any error loading it
                }
            }).filter(cmd => cmd !== null);  // Filter out invalid commands

            // Start building the description for the embed
            let description = `**🌐 Bot Stats:** Serving in **${client.guilds.cache.size}** servers.\n\n`;

            // Message Commands Section
            description += `**💬 Message Commands [${messageCommands.length}]:**\n`;
            if (messageCommands.length > 0) {
                messageCommands.forEach(cmd => {
                    description += `- \`~${cmd.name}\` - ${cmd.description}\n`; // Using `~` as prefix
                });
            } else {
                description += 'No message commands available.\n';
            }

            // Slash Commands Section
            description += `\n**⚡ Slash Commands [${slashCommands.length}]:**\n`;
            if (slashCommands.length > 0) {
                slashCommands.forEach(cmd => {
                    description += `- \`/${cmd.name}\` - ${cmd.description}\n`;
                });
            } else {
                description += 'No slash commands available.\n';
            }

            // Ensure description doesn't exceed Discord's embed character limit (4096)
            if (description.length > 4096) {
                description = description.slice(0, 4093) + '...';
            }

            // Create and send the embed
            const embed = new EmbedBuilder()
                .setTitle('📖 Uta Music Bot - Command List')
                .setColor(0x1DB954)
                .setDescription(description)
                .setFooter({ text: 'Developed by Luffy | ' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Help command error:', error);
            await message.reply('❌ An error occurred while fetching commands.');
        }
    }
};