const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands'),
        
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        // Ensure core validation
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        try {
            // Load message commands
            const msgCommandsPath = path.join(__dirname, '..', 'message');
            const msgFiles = fs.readdirSync(msgCommandsPath).filter(file => file.endsWith('.js'));
            const messageCommands = msgFiles.map(file => {
                const cmd = require(path.join(msgCommandsPath, file));
                return { name: cmd.name || 'Unknown', description: cmd.description || 'No description' };
            });

            // Load slash commands
            const slashCommandsPath = path.join(__dirname, '..', 'slash');
            const slashFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

            const slashCommands = slashFiles.map(file => {
                try {
                    const cmd = require(path.join(slashCommandsPath, file));
                    if (!cmd.data || !cmd.data.name || !cmd.data.description) {
                        console.warn(`Invalid slash command file (missing name/description): ${file}`);
                        return null;
                    }
                    return {
                        name: cmd.data.name,
                        description: cmd.data.description
                    };
                } catch (err) {
                    console.error(`Error loading slash command file ${file}:`, err);
                    return null;
                }
            }).filter(cmd => cmd !== null);

            // Build embed description
            let description = `**🌐 Bot Stats:** Serving in **${client.guilds.cache.size}** servers.\n\n`;

            description += `**💬 Message Commands [${messageCommands.length}]:**\n`;
            if (messageCommands.length > 0) {
                messageCommands.forEach(cmd => {
                    description += `- \`~${cmd.name}\` - ${cmd.description}\n`;
                });
            } else {
                description += 'No message commands available.\n';
            }

            description += `\n**⚡ Slash Commands [${slashCommands.length}]:**\n`;
            if (slashCommands.length > 0) {
                slashCommands.forEach(cmd => {
                    description += `- \`/${cmd.name}\` - ${cmd.description}\n`;
                });
            } else {
                description += 'No slash commands available.\n';
            }

            if (description.length > 4096) {
                description = description.slice(0, 4093) + '...';
            }

            const embed = new EmbedBuilder()
                .setTitle('📖 Uta Music Bot - Command List')
                .setColor(0x1DB954)
                .setDescription(description)
                .setFooter({ text: 'Developed by Luffy | ' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('Slash help command error:', error);
            await interaction.reply({ content: '❌ An error occurred while fetching commands.', ephemeral: true });
        }
    }
};