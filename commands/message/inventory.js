const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const fs = require('fs');
const path = require('path');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;
const dataPath = path.resolve(__dirname, '../../database/economy.json');
const currencyEmoji = '<a:2891bitcoin:1411802188375916695>';

function loadEconomy() {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dataPath));
}

module.exports = {
    name: 'inventory',
    description: 'Show your inventory items',
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(message, args, client) {
        if (!shiva || typeof shiva.validateCore !== 'function' || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }
        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;
        setTimeout(() => {
            message.delete().catch(() => {});
        }, 4000);

        try {
            const data = loadEconomy();
            const userId = message.author.id;

            if (!data[userId]) {
                data[userId] = { berries: 0, inventory: {} };
            }

            const inventory = data[userId].inventory;
            if (!inventory || Object.keys(inventory).length === 0) {
                const embed = new EmbedBuilder()
                    .setDescription('📭 Your inventory is empty!')
                    .setColor('#FFA500');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }

            // Format inventory as list
            let inventoryList = '';
            for (const [item, qty] of Object.entries(inventory)) {
                inventoryList += `• **${item}** x${qty}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle(`${message.author.username}'s Inventory`)
                .setDescription(inventoryList);

            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 7000));

        } catch (error) {
            console.error('Inventory command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while fetching inventory!')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
