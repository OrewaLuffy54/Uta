const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Server = require('../../models/Server');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoleave')
        .setDescription('Toggle auto-leave VC after music ends')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable auto-leave')
                .setRequired(true)
        ),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        // Check if system core is online
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            const canUse = await checker.canUseMusic(interaction.guild.id, interaction.user.id);
            if (!canUse) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You need DJ permissions to change auto-leave settings!')
                    .setColor('#FF0000');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const enabled = interaction.options.getBoolean('enabled');

            // Update setting in DB
            await Server.findByIdAndUpdate(interaction.guild.id, {
                'settings.autoLeave': enabled
            }, { upsert: true });

            // Optionally set on player instance if exists
            if (conditions.hasActivePlayer) {
                const player = conditions.player;
                player.autoLeave = enabled; // Your player class should handle this
            }

            const embed = new EmbedBuilder()
                .setDescription(`🔄 Auto-leave has been **${enabled ? 'enabled' : 'disabled'}**`)
                .setColor(enabled ? 'GREEN' : 'RED');

            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));

        } catch (error) {
            console.error('Autoleave command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while toggling auto-leave!')
                .setColor('#FF0000');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};
