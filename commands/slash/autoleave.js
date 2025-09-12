const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const Server = require('../../models/Server');
const shiva = require('../../shiva');
const botConfig = require('../../config').bot;

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

// Define fallback colors in case Colors.RED / Colors.GREEN are undefined
const COLOR_RED = Colors?.Red || 0xED4245;
const COLOR_GREEN = Colors?.Green || 0x57F287;
const DEFAULT_EMBED_COLOR = botConfig.embedColor || 0x00AE86;

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
        // Check if Shiva core is online
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            console.error('💀 CRITICAL: Shiva core validation failed in autoleave');
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Bot unavailable')
                .setColor(COLOR_RED);
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
        }

        // Ensure interaction is in a guild
        if (!interaction.guild) {
            const embed = new EmbedBuilder()
                .setDescription('❌ This command can only be used inside a server.')
                .setColor(COLOR_RED);
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        await interaction.deferReply({ ephemeral: true });

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            // Check if the user is in a voice channel
            const voiceChannelId = interaction.member.voice?.channelId;
            if (!voiceChannelId) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You must be in a voice channel to toggle auto-leave!')
                    .setColor(DEFAULT_EMBED_COLOR);
                return interaction.editReply({ embeds: [embed] });
            }

            // Check if the user has DJ permissions
            const hasDJ = await checker.canUseMusic(interaction.guild.id, interaction.user.id);
            if (!hasDJ) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You need DJ permissions to change auto-leave settings!')
                    .setColor(DEFAULT_EMBED_COLOR);
                return interaction.editReply({ embeds: [embed] });
            }

            const enabled = interaction.options.getBoolean('enabled');

            // Update autoLeave setting in the database
            try {
                await Server.findByIdAndUpdate(
                    interaction.guild.id,
                    { $set: { 'settings.autoLeave': enabled } },
                    { upsert: true, new: true }
                );
            } catch (dbError) {
                console.error('Database update error:', dbError);
                const embed = new EmbedBuilder()
                    .setDescription('❌ Failed to update auto-leave setting in the database.')
                    .setColor(COLOR_RED);
                return interaction.editReply({ embeds: [embed] });
            }

            // Optionally update current player instance
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                voiceChannelId
            );

            if (conditions.hasActivePlayer && conditions.player) {
                conditions.player.autoLeave = enabled;
            }

            const successEmbed = new EmbedBuilder()
                .setDescription(`🔄 Auto-leave has been **${enabled ? 'enabled' : 'disabled'}**.`)
                .setColor(enabled ? COLOR_GREEN : COLOR_RED);

            return interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Autoleave command error:', error);
            const errorEmbed = new EmbedBuilder()
                .setDescription('❌ An unexpected error occurred while toggling auto-leave.')
                .setColor(COLOR_RED);
            return interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
