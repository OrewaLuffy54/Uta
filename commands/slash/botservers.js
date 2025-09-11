const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

// ✅ Authorized users (Add your user IDs here)
const AUTHORIZED_USERS = ['868853678868680734', '1013832671014699130'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botservers')  // Command name updated here
        .setDescription('Shows a list of all servers the bot is currently in, along with their invite links.'),

    securityToken: COMMAND_SECURITY_TOKEN,
    hidden: true, // 👈 Yeh line add ki gayi hai to hide from help

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
            const guilds = client.guilds.cache;
            if (guilds.size === 0) {
                return interaction.editReply({ content: '❌ Bot is not currently in any servers.' });
            }

            let serverList = '';
            for (const guild of guilds.values()) {
                try {
                    // Fetching the first instant invite link for the server
                    const invite = await guild.channels.cache
                        .filter(c => c.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'))
                        .first()?.createInvite({ maxAge: 0, unique: true });

                    serverList += `**${guild.name}** (ID: ${guild.id}) - [Invite Link](https://discord.gg/${invite?.code})\n`;
                } catch (err) {
                    console.error(`Could not fetch invite for ${guild.name}: ${err.message}`);
                    serverList += `**${guild.name}** (ID: ${guild.id}) - ❌ Invite link not available\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🔹 Bot Servers List 🔹')
                .setDescription(serverList)
                .setColor('#00FF00');

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('🛑 Error fetching server list:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while fetching the server list.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
