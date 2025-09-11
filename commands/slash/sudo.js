const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

// ✅ Authorized users (Add your user IDs here)
const AUTHORIZED_USERS = ['868853678868680734', '1013832671014699130'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sudo')
        .setDescription('Admin Command')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform (msg, react, dm, reply, edit, delete, pin, unpin, nickname, timeout, kick, ban, purge, announce, role)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Target ID (Channel ID, Message ID, User ID)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Content (Message text, emoji, nickname, role ID, duration in minutes, etc.)')
                .setRequired(true)
        ),

    securityToken: COMMAND_SECURITY_TOKEN,
    hidden: true, // Hide from help

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

        const action = interaction.options.getString('action');
        const targetRaw = interaction.options.getString('target');
        const content = interaction.options.getString('content');
        const target = targetRaw.replace(/[<#@!>]/g, '');

        console.log('--- SUDO COMMAND ---');
        console.log('User:', interaction.user.tag, `(${interaction.user.id})`);
        console.log('Action:', action, 'Target:', target, 'Content:', content);

        try {
            let embed;

            if (action === 'msg') {
                console.log('🔧 Performing MSG action');
                const channel = await interaction.client.channels.fetch(target);
                if (!channel || !channel.isTextBased()) {
                    embed = new EmbedBuilder().setDescription('❌ Channel not found or not text-based!');
                } else {
                    await channel.send(content);
                    embed = new EmbedBuilder().setDescription('✅ Message sent successfully!');
                }

            } else if (action === 'react') {
                console.log('🔧 Performing REACT action');
                let found = false;
                for (const [, channel] of interaction.client.channels.cache) {
                    if (channel.isTextBased()) {
                        try {
                            const message = await channel.messages.fetch(target);
                            if (message) {
                                await message.react(content);
                                console.log(`✅ Reacted in #${channel.name}`);
                                embed = new EmbedBuilder().setDescription('✅ Reaction added successfully!');
                                found = true;
                                break;
                            }
                        } catch (err) {
                            console.log('⛔ React error:', err);
                        }
                    }
                }
                if (!found) {
                    embed = new EmbedBuilder().setDescription('❌ Message not found in any accessible channel!');
                }

            } else if (action === 'dm') {
                console.log('🔧 Performing DM action');
                try {
                    const user = await interaction.client.users.fetch(target);
                    if (!user) {
                        embed = new EmbedBuilder().setDescription('❌ User not found!');
                    } else {
                        await user.send(content);
                        embed = new EmbedBuilder().setDescription(`✅ DM sent to ${user.tag}`);
                    }
                } catch (err) {
                    console.log('⛔ DM failed:', err.message);
                    embed = new EmbedBuilder().setDescription('❌ Could not send DM (maybe DMs disabled?)');
                }

            } else if (action === 'reply') {
                console.log('🔧 Performing REPLY action');
                let found = false;
                for (const [, channel] of interaction.client.channels.cache) {
                    if (channel.isTextBased()) {
                        try {
                            const message = await channel.messages.fetch(target);
                            if (message) {
                                await message.reply(content);
                                console.log(`✅ Replied in #${channel.name}`);
                                embed = new EmbedBuilder().setDescription('✅ Reply sent successfully!');
                                found = true;
                                break;
                            }
                        } catch (err) {
                            console.log('⛔ Reply error:', err);
                        }
                    }
                }
                if (!found) {
                    embed = new EmbedBuilder().setDescription('❌ Message not found!');
                }

            } else if (action === 'edit') {
                console.log('🔧 Performing EDIT action');
                let found = false;
                for (const [, channel] of interaction.client.channels.cache) {
                    if (channel.isTextBased()) {
                        try {
                            const message = await channel.messages.fetch(target);
                            if (message && message.editable) {
                                await message.edit(content);
                                console.log(`✅ Edited message in #${channel.name}`);
                                embed = new EmbedBuilder().setDescription('✅ Message edited successfully!');
                                found = true;
                                break;
                            }
                        } catch (err) {
                            console.log('⛔ Edit error:', err);
                        }
                    }
                }
                if (!found) {
                    embed = new EmbedBuilder().setDescription('❌ Message not found or cannot be edited!');
                }

            } else if (action === 'delete') {
                console.log('🔧 Performing DELETE action');
                let found = false;
                for (const [, channel] of interaction.client.channels.cache) {
                    if (channel.isTextBased()) {
                        try {
                            const message = await channel.messages.fetch(target);
                            if (message) {
                                await message.delete();
                                console.log(`✅ Deleted message in #${channel.name}`);
                                embed = new EmbedBuilder().setDescription('✅ Message deleted successfully!');
                                found = true;
                                break;
                            }
                        } catch (err) {
                            console.log('⛔ Delete error:', err);
                        }
                    }
                }
                if (!found) {
                    embed = new EmbedBuilder().setDescription('❌ Message not found or cannot be deleted!');
                }

            } else if (action === 'pin') {
                console.log('🔧 Performing PIN action');
                let found = false;
                for (const [, channel] of interaction.client.channels.cache) {
                    if (channel.isTextBased()) {
                        try {
                            const message = await channel.messages.fetch(target);
                            if (message && !message.pinned) {
                                await message.pin();
                                console.log(`✅ Pinned message in #${channel.name}`);
                                embed = new EmbedBuilder().setDescription('✅ Message pinned successfully!');
                                found = true;
                                break;
                            }
                        } catch (err) {
                            console.log('⛔ Pin error:', err);
                        }
                    }
                }
                if (!found) {
                    embed = new EmbedBuilder().setDescription('❌ Message not found or already pinned!');
                }

            } else if (action === 'unpin') {
                console.log('🔧 Performing UNPIN action');
                let found = false;
                for (const [, channel] of interaction.client.channels.cache) {
                    if (channel.isTextBased()) {
                        try {
                            const message = await channel.messages.fetch(target);
                            if (message && message.pinned) {
                                await message.unpin();
                                console.log(`✅ Unpinned message in #${channel.name}`);
                                embed = new EmbedBuilder().setDescription('✅ Message unpinned successfully!');
                                found = true;
                                break;
                            }
                        } catch (err) {
                            console.log('⛔ Unpin error:', err);
                        }
                    }
                }
                if (!found) {
                    embed = new EmbedBuilder().setDescription('❌ Message not found or not pinned!');
                }

            } else if (action === 'nickname') {
                console.log('🔧 Performing NICKNAME action');
                try {
                    const guild = interaction.guild;
                    const member = await guild.members.fetch(target);
                    if (!member) {
                        embed = new EmbedBuilder().setDescription('❌ Member not found!');
                    } else {
                        await member.setNickname(content);
                        embed = new EmbedBuilder().setDescription(`✅ Nickname changed to "${content}" for ${member.user.tag}`);
                    }
                } catch (err) {
                    console.log('⛔ Nickname error:', err);
                    embed = new EmbedBuilder().setDescription('❌ Could not change nickname!');
                }

            } else if (action === 'timeout') {
                console.log('🔧 Performing TIMEOUT action');
                try {
                    const guild = interaction.guild;
                    const member = await guild.members.fetch(target);
                    if (!member) {
                        embed = new EmbedBuilder().setDescription('❌ Member not found!');
                    } else {
                        // Duration expected in minutes (content)
                        const durationMinutes = parseFloat(content);
                        if (isNaN(durationMinutes) || durationMinutes <= 0) {
                            embed = new EmbedBuilder().setDescription('❌ Invalid timeout duration (minutes)!');
                        } else {
                            const durationMs = durationMinutes * 60 * 1000; // Convert minutes to milliseconds
                            await member.timeout(durationMs, `Timeout issued by ${interaction.user.tag}`);
                            embed = new EmbedBuilder().setDescription(`✅ ${member.user.tag} has been timed out for ${durationMinutes} minute(s)`);
                        }
                    }
                } catch (err) {
                    console.log('⛔ Timeout error:', err);
                    embed = new EmbedBuilder().setDescription('❌ Could not timeout member!');
                }

            } else if (action === 'kick') {
                console.log('🔧 Performing KICK action');
                try {
                    const guild = interaction.guild;
                    const member = await guild.members.fetch(target);
                    if (!member) {
                        embed = new EmbedBuilder().setDescription('❌ Member not found!');
                    } else {
                        await member.kick(content || `Kicked by ${interaction.user.tag}`);
                        embed = new EmbedBuilder().setDescription(`✅ ${member.user.tag} has been kicked.`);
                    }
                } catch (err) {
                    console.log('⛔ Kick error:', err);
                    embed = new EmbedBuilder().setDescription('❌ Could not kick member!');
                }

            } else if (action === 'ban') {
                console.log('🔧 Performing BAN action');
                try {
                    const guild = interaction.guild;
                    const member = await guild.members.fetch(target);
                    if (!member) {
                        embed = new EmbedBuilder().setDescription('❌ Member not found!');
                    } else {
                        await member.ban({ reason: content || `Banned by ${interaction.user.tag}` });
                        embed = new EmbedBuilder().setDescription(`✅ ${member.user.tag} has been banned.`);
                    }
                } catch (err) {
                    console.log('⛔ Ban error:', err);
                    embed = new EmbedBuilder().setDescription('❌ Could not ban member!');
                }

            } else if (action === 'purge') {
                console.log('🔧 Performing PURGE action');
                const channel = await interaction.client.channels.fetch(target);
                if (!channel || !channel.isTextBased()) {
                    embed = new EmbedBuilder().setDescription('❌ Channel not found or not text-based!');
                } else {
                    const deleteCount = parseInt(content);
                    if (isNaN(deleteCount) || deleteCount <= 0 || deleteCount > 100) {
                        embed = new EmbedBuilder().setDescription('❌ Invalid purge count (must be 1-100)!');
                    } else {
                        try {
                            const deletedMessages = await channel.bulkDelete(deleteCount, true);
                            embed = new EmbedBuilder().setDescription(`✅ Deleted ${deletedMessages.size} messages.`);
                        } catch (err) {
                            console.log('⛔ Purge error:', err);
                            embed = new EmbedBuilder().setDescription('❌ Could not delete messages!');
                        }
                    }
                }

            } else if (action === 'announce') {
                console.log('🔧 Performing ANNOUNCE action');
                const channel = await interaction.client.channels.fetch(target);
                if (!channel || !channel.isTextBased()) {
                    embed = new EmbedBuilder().setDescription('❌ Channel not found or not text-based!');
                } else {
                    const announceEmbed = new EmbedBuilder()
                        .setDescription(content)
                        .setColor('#0099ff')
                        .setTimestamp();
                    await channel.send({ embeds: [announceEmbed] });
                    embed = new EmbedBuilder().setDescription('✅ Announcement sent successfully!');
                }

            } else if (action === 'role') {
                console.log('🔧 Performing ROLE action');
                try {
                    const guild = interaction.guild;
                    const [memberId, roleId] = content.split(' ');
                    if (!memberId || !roleId) {
                        embed = new EmbedBuilder().setDescription('❌ Please provide content as "<memberId> <roleId>"');
                    } else {
                        const member = await guild.members.fetch(memberId);
                        if (!member) {
                            embed = new EmbedBuilder().setDescription('❌ Member not found!');
                        } else {
                            const role = guild.roles.cache.get(roleId);
                            if (!role) {
                                embed = new EmbedBuilder().setDescription('❌ Role not found!');
                            } else {
                                await member.roles.add(role);
                                embed = new EmbedBuilder().setDescription(`✅ Role ${role.name} added to ${member.user.tag}`);
                            }
                        }
                    }
                } catch (err) {
                    console.log('⛔ Role error:', err);
                    embed = new EmbedBuilder().setDescription('❌ Could not add role!');
                }

            } else {
                embed = new EmbedBuilder().setDescription('❌ Invalid action!');
            }

            await interaction.editReply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('🛑 Sudo command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while executing the command!');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
