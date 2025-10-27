const { EmbedBuilder } = require('discord.js');
const admin = require("firebase-admin");

const FIRESTORE_DAILY_COLLECTION = "daily-content";
const db = admin.firestore();

module.exports = (client) => {
    client.createDay = async () => {
        const today = new Date();

        let date = getDateString(today);

        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const today_str_for_doc_id = `${today.getFullYear()}-${month}-${day}`;

        const docRef = db.collection(FIRESTORE_DAILY_COLLECTION).doc(today_str_for_doc_id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log(`No daily content found for ${today_str_for_doc_id}.`);
            return "I could not find the facts for today. The daily facts ingestion might not have run yet. Please check again later!";
        }

        const data = docSnap.data();
        const { events, births, deaths, national_days } = data;

        // Format national days into a list
        const text = national_days.slice(0, 15).map((nd, index) => `${index + 1}. ${nd}`).join('\n');

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
                value: '[Support the developer](https://buymeacoffee.com/dirkyg)',
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