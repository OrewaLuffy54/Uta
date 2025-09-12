const { EmbedBuilder } = require('discord.js');
const shiva = require('../shiva');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);

            if (!command) {
                return safeReply(interaction, {
                    content: '🚫 This command is not available!',
                    ephemeral: true
                });
            }

            // Defer early to avoid "Unknown interaction"
            try {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                }
            } catch (err) {
                console.warn('Failed to defer interaction:', err.message);
                return;
            }

            // Shiva Core validation
            if (!shiva?.validateCore?.()) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ System core offline - Commands unavailable')
                    .setColor('#FF0000');
                return safeReply(interaction, { embeds: [embed], ephemeral: true });
            }

            // Security token check
            if (!command.securityToken || command.securityToken !== shiva.SECURITY_TOKEN) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ Command blocked - Security validation failed')
                    .setColor('#FF6600');
                return safeReply(interaction, { embeds: [embed], ephemeral: true });
            }

            try {
                // Run command
                await command.execute(interaction, client);

                // Post-execution check
                if (!interaction.shivaValidated || interaction.securityToken !== shiva.SECURITY_TOKEN) {
                    const embed = new EmbedBuilder()
                        .setDescription('⚠️ Security anomaly detected - Command execution logged')
                        .setColor('#FF6600');
                    await safeReply(interaction, { embeds: [embed], ephemeral: true });
                }

            } catch (error) {
                console.error('Error executing slash command:', error);

                const isShivaError = error.message?.includes('shiva') || error.message?.includes('validateCore');

                const embed = new EmbedBuilder()
                    .setDescription(isShivaError
                        ? '❌ System security modules offline - Commands unavailable'
                        : '❌ An error occurred while executing this command!')
                    .setColor('#FF0000');

                await safeReply(interaction, { embeds: [embed], ephemeral: true });
            }

        } else if (interaction.isButton()) {
            await handleSecureMusicButton(interaction, client);
        }
    }
};

// Utility: Safely send a reply without causing double-reply errors
async function safeReply(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(options);
        } else {
            await interaction.reply(options);
        }
    } catch (err) {
        console.warn('safeReply error:', err.message);
    }
}

// Secure music control button handler
async function handleSecureMusicButton(interaction, client) {
    if (interaction.customId === 'music_support') return;

    const ConditionChecker = require('../utils/checks');
    const checker = new ConditionChecker(client);

    try {
        const conditions = await checker.checkMusicConditions(
            interaction.guild.id,
            interaction.user.id,
            interaction.member.voice?.channelId,
            true
        );

        if (!conditions.hasActivePlayer) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        if (!conditions.userInVoice) {
            return interaction.reply({ content: '❌ You need to be in a voice channel to control music!', ephemeral: true });
        }

        if (!conditions.sameVoiceChannel) {
            const botChannelName = interaction.guild.channels.cache.get(conditions.botVoiceChannel)?.name || 'Unknown';
            return interaction.reply({
                content: `❌ You must be in **${botChannelName}** to control music!`,
                ephemeral: true
            });
        }

        const canUseMusic = await checker.canUseMusic(interaction.guild.id, interaction.user.id);
        if (!canUseMusic) {
            return interaction.reply({
                content: '❌ You need DJ permissions to control music!',
                ephemeral: true
            });
        }

        const player = conditions.player;
        const action = interaction.customId.replace('music_', '');
        const CentralEmbedHandler = require('../utils/centralEmbed');
        const centralHandler = new CentralEmbedHandler(client);

        const updateCentralEmbed = async () => {
            if (player && player.current) {
                const info = {
                    title: player.current.info.title,
                    author: player.current.info.author,
                    duration: player.current.info.length,
                    thumbnail: player.current.info.thumbnail,
                    requester: player.current.info.requester,
                    paused: player.paused,
                    volume: player.volume,
                    loop: player.loop,
                    queueLength: player.queue.size
                };
                await centralHandler.updateCentralEmbed(interaction.guild.id, info);
            }
        };

        switch (action) {
            case 'pause':
                player.pause(true);
                await interaction.reply({ content: '⏸️ Music paused', ephemeral: true });
                await updateCentralEmbed();
                break;

            case 'resume':
                player.pause(false);
                await interaction.reply({ content: '▶️ Music resumed', ephemeral: true });
                await updateCentralEmbed();
                break;

            case 'skip':
                const currentTrack = player.current?.info?.title || 'Unknown';
                player.stop();
                await interaction.reply({ content: `⏭️ Skipped: \`${currentTrack}\``, ephemeral: true });
                break;

            case 'stop':
                player.destroy();
                await interaction.reply({ content: '🛑 Music stopped and disconnected', ephemeral: true });
                break;

            case 'clear':
                const cleared = player.queue.size;
                player.queue.clear();
                await interaction.reply({ content: `🗑️ Cleared ${cleared} songs from queue`, ephemeral: true });
                await updateCentralEmbed();
                break;

            case 'loop':
                const currentLoop = player.loop || 'none';
                const loopModes = { none: 'track', track: 'queue', queue: 'none' };
                const loopEmojis = { none: '➡️', track: '🔂', queue: '🔁' };
                const newLoop = loopModes[currentLoop] || 'track';

                player.setLoop(newLoop);
                await interaction.reply({
                    content: `${loopEmojis[newLoop]} Loop mode: **${newLoop}**`,
                    ephemeral: true
                });
                await updateCentralEmbed();
                break;

            case 'volume_up':
                const up = Math.min(player.volume + 10, 100);
                player.setVolume(up);
                await interaction.reply({ content: `🔊 Volume increased to ${up}%`, ephemeral: true });
                await updateCentralEmbed();
                break;

            case 'volume_down':
                const down = Math.max(player.volume - 10, 1);
                player.setVolume(down);
                await interaction.reply({ content: `🔉 Volume decreased to ${down}%`, ephemeral: true });
                await updateCentralEmbed();
                break;

            case 'queue':
                if (player.queue.size === 0) {
                    return interaction.reply({ content: '📜 Queue is empty', ephemeral: true });
                }

                const list = player.queue.map((track, i) =>
                    `\`${i + 1}.\` ${track.info.title.substring(0, 40)}${track.info.title.length > 40 ? '...' : ''}`
                ).slice(0, 10).join('\n');

                const more = player.queue.size > 10
                    ? `\n...and ${player.queue.size - 10} more`
                    : '';

                await interaction.reply({
                    content: `📜 **Queue (${player.queue.size} songs)**\n${list}${more}`,
                    ephemeral: true
                });
                break;

            case 'shuffle':
                if (player.queue.size === 0) {
                    return interaction.reply({ content: '❌ Queue is empty, nothing to shuffle!', ephemeral: true });
                }

                player.queue.shuffle();
                await interaction.reply({ content: `🔀 Shuffled ${player.queue.size} songs`, ephemeral: true });
                break;

            default:
                await interaction.reply({ content: '❌ Unknown action', ephemeral: true });
        }

    } catch (error) {
        console.error('Error handling secure music button:', error);
        await interaction.reply({
            content: '❌ An error occurred while processing your request',
            ephemeral: true
        }).catch(() => {});
    }
}
