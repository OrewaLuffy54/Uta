const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: ['CHANNEL'], // For DMs & buttons
});

// Owners' Discord IDs
const BOT_OWNER_IDS = ['868853678868680734', '1013832671014699130'];

// For storing active DMs from users: Map userId => { username, lastMessage, attachments }
const activeUserDMs = new Map();

// For storing owner's selected user: ownerId => userId
const selectedUserMap = new Map();

// For storing owner dashboard message: ownerId => message
const ownerDashboardMessages = new Map();

// Pagination for buttons (5 users per page)
const USERS_PER_PAGE = 5;

// Utility: Build dashboard embed + buttons for an owner
function buildDashboard(ownerId, page = 0) {
    const allUsers = Array.from(activeUserDMs.entries());
    const totalPages = Math.ceil(allUsers.length / USERS_PER_PAGE);

    // Clamp page
    page = Math.min(page, totalPages - 1);
    page = Math.max(page, 0);

    const sliceUsers = allUsers.slice(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE);

    const embed = new EmbedBuilder()
        .setTitle(`📬 User DMs - Page ${page + 1}/${totalPages || 1}`)
        .setDescription('Click a button below to select user to reply to.\n\n**Users:**')
        .setColor(0x00AE86)
        .setTimestamp();

    if (sliceUsers.length === 0) {
        embed.setDescription('No active user DMs at the moment.');
    } else {
        for (const [userId, data] of sliceUsers) {
            const isSelected = selectedUserMap.get(ownerId) === userId;
            embed.addFields({
                name: `${isSelected ? '🟢 ' : ''}${data.username} (${userId})`,
                value: data.lastMessage || '*No message text*',
                inline: false
            });
        }
    }

    // Buttons for users + navigation
    const buttons = new ActionRowBuilder();

    sliceUsers.forEach(([userId, data]) => {
        const isSelected = selectedUserMap.get(ownerId) === userId;
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(`selectUser_${userId}`)
                .setLabel(data.username)
                .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(isSelected)
        );
    });

    // Navigation buttons if multiple pages
    const navButtons = new ActionRowBuilder();

    navButtons.addComponents(
        new ButtonBuilder()
            .setCustomId('prevPage')
            .setLabel('⬅️ Prev')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId('nextPage')
            .setLabel('Next ➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1 || totalPages === 0)
    );

    return { embed, components: [buttons, navButtons], page };
}

async function updateDashboardForOwner(ownerId, page = 0) {
    let dashboardMsg = ownerDashboardMessages.get(ownerId);
    const { embed, components } = buildDashboard(ownerId, page);

    if (!dashboardMsg) {
        try {
            const owner = await client.users.fetch(ownerId);
            dashboardMsg = await owner.send({ embeds: [embed], components });
            ownerDashboardMessages.set(ownerId, dashboardMsg);
        } catch (err) {
            console.error(`Failed to send dashboard to owner ${ownerId}:`, err);
            return;
        }
    } else {
        try {
            await dashboardMsg.edit({ embeds: [embed], components });
        } catch (err) {
            // Message could be deleted or not editable, try resend
            try {
                const owner = await client.users.fetch(ownerId);
                dashboardMsg = await owner.send({ embeds: [embed], components });
                ownerDashboardMessages.set(ownerId, dashboardMsg);
            } catch (e) {
                console.error(`Failed to resend dashboard to owner ${ownerId}:`, e);
            }
        }
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.channel.type === 1) {
        // Owner replying via DM
        if (BOT_OWNER_IDS.includes(message.author.id)) {
            const userId = selectedUserMap.get(message.author.id);
            if (!userId) {
                try {
                    await message.author.send("⚠️ Please select a user from the dashboard first.");
                } catch {}
                return;
            }

            try {
                const user = await client.users.fetch(userId);

                if (message.attachments.size > 0) {
                    await user.send({
                        content: message.content || null,
                        files: [...message.attachments.values()].map(att => att.url),
                    });
                } else {
                    await user.send(message.content);
                }

                // Confirmation
                await message.author.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('✅ Reply Sent')
                            .setDescription(`Your reply has been sent to <@${userId}>.`)
                            .setColor(0x00AE86)
                            .setTimestamp()
                    ]
                });
            } catch (err) {
                console.error('Failed to send reply to user:', err);
                try {
                    await message.author.send(`❌ Could not send your reply to <@${userId}>.`);
                } catch {}
            }
            return;
        }

        // User DM to bot - store/update data and update dashboards
        activeUserDMs.set(message.author.id, {
            username: message.author.tag,
            lastMessage: message.content || '*[Attachment only]*',
            attachments: message.attachments.map(att => att.url)
        });

        // Update all owners dashboards (page 0 for simplicity)
        for (const ownerId of BOT_OWNER_IDS) {
            updateDashboardForOwner(ownerId, 0);
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (!BOT_OWNER_IDS.includes(interaction.user.id)) {
        await interaction.reply({ content: "You are not authorized to use this.", ephemeral: true });
        return;
    }

    const ownerId = interaction.user.id;
    const dashMsg = ownerDashboardMessages.get(ownerId);
    if (!dashMsg || dashMsg.id !== interaction.message.id) {
        // Not dashboard message, ignore or optionally respond
        await interaction.reply({ content: 'This button is not valid anymore.', ephemeral: true });
        return;
    }

    const [action, userId] = interaction.customId.split('_');

    // For paging buttons
    if (interaction.customId === 'prevPage' || interaction.customId === 'nextPage') {
        // Extract current page from message embed title
        const title = interaction.message.embeds[0]?.title || '';
        const match = title.match(/Page (\d+)\/(\d+)/);
        let currentPage = 0;
        if (match) currentPage = parseInt(match[1], 10) - 1;

        const totalPages = Math.ceil(activeUserDMs.size / USERS_PER_PAGE);

        let newPage = currentPage;
        if (interaction.customId === 'prevPage') newPage = Math.max(0, currentPage - 1);
        else if (interaction.customId === 'nextPage') newPage = Math.min(totalPages - 1, currentPage + 1);

        const { embed, components } = buildDashboard(ownerId, newPage);
        try {
            await interaction.update({ embeds: [embed], components });
        } catch (err) {
            console.error('Failed to update dashboard pagination:', err);
            await interaction.followUp({ content: 'Failed to update dashboard.', ephemeral: true });
        }
        return;
    }

    if (action === 'selectUser') {
        if (!activeUserDMs.has(userId)) {
            await interaction.reply({ content: 'User not found or inactive.', ephemeral: true });
            return;
        }
        selectedUserMap.set(ownerId, userId);

        // Refresh dashboard with new selection highlighted
        const { embed, components } = buildDashboard(ownerId);
        try {
            await interaction.update({ embeds: [embed], components });
            // Optional: send ephemeral confirmation
            // await interaction.followUp({ content: `Selected <@${userId}> for replying!`, ephemeral: true });
        } catch (err) {
            console.error('Failed to update dashboard after selection:', err);
        }
    }
});

client.login('TOKEN');
