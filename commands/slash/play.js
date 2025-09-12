const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or add to queue')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or search query')
                .setRequired(true)
        ),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        try {
            // Validate core
            if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ System core offline - Command unavailable')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            interaction.shivaValidated = true;
            interaction.securityToken = COMMAND_SECURITY_TOKEN;

            // Acknowledge interaction
            await interaction.deferReply();

            const ConditionChecker = require('../../utils/checks');
            const PlayerHandler = require('../../utils/player');
            const ErrorHandler = require('../../utils/errorHandler');
            
            const query = interaction.options.getString('query');

            const checker = new ConditionChecker(client);
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id, 
                interaction.user.id, 
                interaction.member.voice?.channelId
            );

            const errorMsg = checker.getErrorMessage(conditions, 'play');
            if (errorMsg) {
                const embed = new EmbedBuilder().setDescription(errorMsg);
                await interaction.editReply({ embeds: [embed] });
                return setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }

            const playerHandler = new PlayerHandler(client);
            const player = await playerHandler.createPlayer(
                interaction.guild.id,
                interaction.member.voice.channelId,
                interaction.channel.id
            );

            const result = await playerHandler.playSong(player, query, interaction.user);

            let embed;
            if (result.type === 'track') {
                embed = new EmbedBuilder().setDescription(`✅ Added to queue: **${result.track.info.title}**`);
            } else if (result.type === 'playlist') {
                embed = new EmbedBuilder().setDescription(`✅ Added **${result.tracks}** songs from playlist: **${result.name}**`);
            } else {
                embed = new EmbedBuilder().setDescription('❌ No results found for your query!');
            }

            await interaction.editReply({ embeds: [embed] });
            setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);

        } catch (error) {
            console.error('Play slash command error:', error);

            // Optional: use your custom error handler
            const ErrorHandler = require('../../utils/errorHandler');
            ErrorHandler.handle?.(error, 'play slash command');

            const fallbackEmbed = new EmbedBuilder()
                .setDescription('❌ An error occurred while trying to play music!')
                .setColor('#FF0000');

            // Only reply if not already done
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ embeds: [fallbackEmbed], ephemeral: true }).catch(() => {});
            } else {
                return interaction.editReply({ embeds: [fallbackEmbed] }).catch(() => {});
            }
        }
    }
};
