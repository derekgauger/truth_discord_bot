const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    client.createDay = async () => {
        const today = new Date();

        let date = getDateString(today);

        const month = today.toLocaleString('default', { month: 'long' });
        const day = today.getDate();

        var text = "\n" + fs.readFileSync("national_days.txt").toString();

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('National Days')
            .setURL('https://nationaltoday.com/today/')
            .setAuthor({
            name: 'Truth - ' + date,
            iconURL: "https://i.imgur.com/6NtiiP4.png",
            url: 'https://nationaltoday.com/today/'
            })
            .setThumbnail("https://i.imgur.com/6NtiiP4.png")
            .addFields(
            {
                name: 'Current National Days',
                value: text
            },
            {
                name: '☕ Buy Me a Coffee (Help Cover Hosting Fees)',
                value: '[Support the developer](https://coff.ee/dirkyg)',
                inline: false
            }
            )
            .setTimestamp(today)
            .setFooter({
            text: 'Truth by Dirk',
            iconURL: "https://i.imgur.com/6NtiiP4.png"
            });

        return embed;
    }
}

function getDateString(today) {
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    const date = mm + '/' + dd + '/' + yyyy;

    return date;
}