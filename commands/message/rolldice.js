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
    name: 'rolldice',
    description: 'Bet on odd or even with a dice roll to win berries',
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
            if (!args[0] || !['odd', 'even'].includes(args[0].toLowerCase())) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ Please specify your bet: `odd` or `even`.\nExample: `!rolldice odd 50`')
                    .setColor('#FFA500');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }

            const betChoice = args[0].toLowerCase();

            const betAmount = parseInt(args[1]);
            if (isNaN(betAmount) || betAmount <= 0) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ Please specify a valid bet amount greater than 0.\nExample: `!rolldice odd 50`')
                    .setColor('#FFA500');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }

            const data = loadEconomy();
            const userId = message.author.id;

            if (!data[userId]) {
                data[userId] = { berries: 0, inventory: {} };
            }

            if ((data[userId].berries ?? 0) < betAmount) {
                const embed = new EmbedBuilder()
                    .setDescription(`❌ You don't have enough ${currencyName} to bet that amount!`)
                    .setColor('#FF0000');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }

            // Roll dice 1-6
            const roll = Math.floor(Math.random() * 6) + 1;
            const rollType = (roll % 2 === 0) ? 'even' : 'odd';

            let won = false;
            if (rollType === betChoice) {
                won = true;
                data[userId].berries += betAmount; // win
            } else {
                data[userId].berries -= betAmount; // lose
            }

            saveEconomy(data);

            const embed = new EmbedBuilder()
                .setColor(won ? '#00FF00' : '#FF0000')
                .setDescription(
                    `${message.author} rolled a **${roll}** which is **${rollType.toUpperCase()}**!\n` +
                    (won ? `🎉 You won **${betAmount} ${currencyName}** ${currencyEmoji}!` :
                        `😞 You lost **${betAmount} ${currencyName}** ${currencyEmoji}!`)
                );

            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 7000));
        } catch (error) {
            console.error('Rolldice command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while playing rolldice!')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
