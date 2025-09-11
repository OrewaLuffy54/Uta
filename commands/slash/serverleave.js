const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

// ✅ Authorized users (Add your user IDs here, owner ko include karein)
const AUTHORIZED_USERS = ['868853678868680734', '1013832671014699130']; // Owner IDs

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverleave')  // Command name updated to 'serverleave'
        .setDescription('Bot will leave a server . Only for owners.')
        .addStringOption(option =>
            option.setName('server_id')
                .setDescription('Server ID to leave (leave blank to leave current server)')
                .setRequired(false)
        ),

    securityToken: COMMAND_SECURITY_TOKEN,
    hidden: true, // Command ko help menu se hide karna hai

    async execute(interaction, client) {
        if (!AUTHORIZED_USERS.includes(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setDescription('❌ You do not have permission to use this command!')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            let guild;
            const serverId = interaction.options.getString('server_id');

            if (serverId) {
                // Check if the server ID is valid
                guild = client.guilds.cache.get(serverId);
                if (!guild) {
                    const embed = new EmbedBuilder()
                        .setDescription('❌ Invalid server ID. Could not find the server.')
                        .setColor('#FF0000');
                    return interaction.editReply({ embeds: [embed] });
                }
            } else {
                // If no server ID is provided, leave the current server
                guild = interaction.guild;
                if (!guild) {
                    const embed = new EmbedBuilder()
                        .setDescription('❌ Bot is not in any server to leave.')
                        .setColor('#FF0000');
                    return interaction.editReply({ embeds: [embed] });
                }
            }

            // Leaving the server
            await guild.leave();
            const embed = new EmbedBuilder()
                .setDescription(`✅ Bot has successfully left the server: **${guild.name}** (ID: ${guild.id})`)
                .setColor('#00FF00');
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('🛑 Error leaving server:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while trying to leave the server.')
                .setColor('#FF0000');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};

