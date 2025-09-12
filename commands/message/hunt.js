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
    name: 'hunt',
    description: 'Go hunting to earn berries!',
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

            // Hunt rewards range (random)
            const minReward = 10;
            const maxReward = 50;
            const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;

            data[userId].berries += reward;
            saveEconomy(data);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`${message.author} went hunting and earned **${reward} ${currencyName}** ${currencyEmoji}!`);

            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        } catch (error) {
            console.error('Hunt command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while hunting!')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
