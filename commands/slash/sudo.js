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
                .setDescription('Action to perform (msg, react, dm, reply, sticker)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Target ID (Channel ID, Message ID, User ID)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Content (Message text, emoji, sticker ID)')
                .setRequired(true)
        ),

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
                                await message.reply(content);  // Reply to the original message
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

            } else if (action === 'sticker') {
                console.log('🔧 Performing STICKER action');
                const stickerId = content;
                if (!stickerId) {
                    embed = new EmbedBuilder().setDescription('❌ Invalid sticker ID!');
                } else {
                    try {
                        const channel = await interaction.client.channels.fetch(target);
                        await channel.send({ sticker: stickerId });
                        embed = new EmbedBuilder().setDescription('✅ Sticker sent successfully!');
                    } catch (err) {
                        console.error('⛔ Sticker sending error:', err);
                        embed = new EmbedBuilder().setDescription('❌ Could not send sticker!');
                    }
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
