const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const fs = require('fs');
const path = require('path');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;
const dataPath = path.resolve(__dirname, '../../database/economy.json');
const currencyName = 'berries';
const currencyEmoji = '<a:2891bitcoin:1411802188375916695>';

function loadEconomy() {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveEconomy(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'daily',
    description: 'Claim your daily berries reward!',
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
                data[userId] = { berries: 0, inventory: {}, lastDaily: 0 };
            }

            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000;

            if (data[userId].lastDaily && (now - data[userId].lastDaily) < ONE_DAY) {
                const timeLeft = ONE_DAY - (now - data[userId].lastDaily);
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

                const embed = new EmbedBuilder()
                    .setDescription(`⏳ You have already claimed your daily reward! Come back in **${hours}h ${minutes}m**.`)
                    .setColor('#FFA500');

                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }

            // Daily reward amount
            const dailyReward = 100;

            data[userId].berries += dailyReward;
            data[userId].lastDaily = now;

            saveEconomy(data);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`🎉 You claimed your daily reward of **${dailyReward} ${currencyName}** ${currencyEmoji}!`);

            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

        } catch (error) {
            console.error('Daily command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while claiming daily reward!')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
