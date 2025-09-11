const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js'); // Import Colors
const Server = require('../../models/Server');
const shiva = require('../../shiva');

// Import bot configuration from config.js
const botConfig = require('../../config').bot; // Update this path to where the config file is located
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
        if (!shiva || typeof shiva.validateCore !== 'function' || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor(botConfig.embedColor);  // Using botConfig.embedColor
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            // Check if the user is in a voice channel
            if (!interaction.member.voice?.channelId) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You must be in a voice channel to toggle auto-leave!')
                    .setColor(botConfig.embedColor);  // Using botConfig.embedColor
                return interaction.editReply({ embeds: [embed] });
            }

            // Check music conditions
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            // Check if the user has DJ permissions
            const canUse = await checker.canUseMusic(interaction.guild.id, interaction.user.id);
            if (!canUse) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You need DJ permissions to change auto-leave settings!')
                    .setColor(botConfig.embedColor);  // Using botConfig.embedColor
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const enabled = interaction.options.getBoolean('enabled');

            // Update setting in DB
            try {
                await Server.findByIdAndUpdate(interaction.guild.id, {
                    'settings.autoLeave': enabled
                }, { upsert: true });
            } catch (dbError) {
                console.error('Database update error:', dbError);
                const embed = new EmbedBuilder()
                    .setDescription('❌ Failed to update auto-leave setting in the database.')
                    .setColor(botConfig.embedColor);  // Using botConfig.embedColor
                return interaction.editReply({ embeds: [embed] });
            }

            // Optionally set on player instance if exists
            if (conditions.hasActivePlayer && conditions.player) {
                const player = conditions.player;
                player.autoLeave = enabled; // Ensure this is a valid player object
            }

            const embed = new EmbedBuilder()
                .setDescription(`🔄 Auto-leave has been **${enabled ? 'enabled' : 'disabled'}**`)
                .setColor(enabled ? Colors.GREEN : Colors.RED);  // Using default colors for green/red

            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));

        } catch (error) {
            console.error('Autoleave command error:', error);
            console.error('Error details:', error.message);  // Log the error message
            console.error('Stack trace:', error.stack);  // Log the stack trace for better insight

            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while toggling auto-leave!')
                .setColor(botConfig.embedColor);  // Using botConfig.embedColor
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};
