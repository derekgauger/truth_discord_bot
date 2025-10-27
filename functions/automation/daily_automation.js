const Discord = require('discord.js');
const admin = require("firebase-admin");

// --- Configuration Constants ---
const FIRESTORE_CHANNEL_COLLECTION = "discord-channels";


// --- Firebase Initialization ---
// Initialize Admin SDK globally if not already done.
// This is done once when the file is loaded.
try {
    admin.initializeApp();
} catch (e) {
    // Safely ignore the error if the app is already initialized.
    if (!/already exists/.test(e.message)) {
        console.error("Firebase Admin SDK Initialization Error:", e);
        throw e;
    }
}
const db = admin.firestore();


module.exports = (client) => {
    /**
     * Iterates through all guilds, fetches the designated channel ID from Firestore,
     * and sends two pieces of daily content: the simple blurb and the rich day-specific content.
     * Assumes client.createBlurb() and client.createDay() are available functions.
     */
    client.displayDailyContent = async () => {
        try {
            const guild_id_list = client.guilds.cache.map(guild => guild.id);
            
            const blurbContent = await client.createBlurb();
            if (!blurbContent || typeof blurbContent !== 'string') {
                console.error("Failed to generate valid blurb content (expected string). Aborting daily content send.");
                return;
            }
            const blurbMessageOptions = { content: blurbContent };

            const messageResult = await client.createDay();
            let dayMessageOptions = {};

            if (typeof messageResult === 'string') {
                console.warn("Failed to generate Embed for daily content: received error string. Sending as simple text.");
                dayMessageOptions.content = messageResult; 
            } else if (messageResult instanceof Discord.EmbedBuilder) {
                dayMessageOptions.embeds = [messageResult];
            } else {
                console.error("Failed to generate valid day content (neither Embed nor string). Aborting daily content send.");
                return;
            }

            const promises = guild_id_list.map(async (guildId) => {
                try {
                    const docRef = db.collection(FIRESTORE_CHANNEL_COLLECTION).doc(guildId);
                    const docSnap = await docRef.get();

                    if (!docSnap.exists) {
                        console.log(`No configuration found in Firestore for guild ${guildId}. Skipping.`);
                        return;
                    }

                    const data = docSnap.data();
                    const channel_id = data.channelId;

                    if (!channel_id) {
                        console.error(`Firestore document for guild ${guildId} is missing the channelId field. Skipping.`);
                        return;
                    }

                    const channel = client.channels.cache.get(channel_id);

                    if (!channel) {
                        console.error(`Discord channel with ID ${channel_id} not found for guild ${guildId}. It may have been deleted.`);
                        return;
                    }

                    await channel.send(dayMessageOptions);
                    
                    await channel.send(blurbMessageOptions);

                } catch (err) {
                    console.error(`Error processing guild ${guildId} during daily content send:`, err);
                }
            });

            await Promise.all(promises);
            console.log(`Successfully attempted to display BOTH daily blurb and daily content in ${promises.length} guilds.`);
            
        } catch (err) {
            console.error('Fatal error in displayDailyContent:', err);
        }
    };
};
