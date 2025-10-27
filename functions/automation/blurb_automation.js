// Note: This file name is changed to avoid collision if you keep the original.

const Discord = require('discord.js');
// The createBlurb function must be attached to the client instance, usually in your main bot file.

// The Admin SDK is initialized in the file containing client.createBlurb (e.g., blurb_automation.js)
const admin = require("firebase-admin");

// Initialize Admin SDK globally if not already done.
// We assume GOOGLE_APPLICATION_CREDENTIALS is set for local testing.
try {
    admin.initializeApp();
} catch (e) {
    if (!/already exists/.test(e.message)) {
        console.error("Firebase Admin SDK Initialization Error:", e);
        throw e;
    }
}
const db = admin.firestore();
const FIRESTORE_CHANNEL_COLLECTION = "discord-channels";


module.exports = (client) => {
    /**
     * Iterates through all guilds the bot is in, fetches the designated channel ID
     * from Firestore, and sends the daily blurb to that channel.
     */
    client.displayBlurb = async () => {
        try {
            const guild_id_list = client.guilds.cache.map(guild => guild.id);
            
            // Call the function that generates the blurb string
            const blurbContent = await client.createBlurb();

            // Check if the blurb content is valid before trying to send
            if (!blurbContent || typeof blurbContent !== 'string') {
                console.error("Failed to generate valid blurb content (expected string). Aborting display.");
                return;
            }

            // Message is always sent as content
            const messageOptions = { content: blurbContent };

            const promises = guild_id_list.map(async (guildId) => {
                try {
                    // 1. Get the document reference using the Guild ID
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

                    // 2. Get the Discord channel object
                    const channel = client.channels.cache.get(channel_id);

                    if (!channel) {
                        console.error(`Discord channel with ID ${channel_id} not found for guild ${guildId}. It may have been deleted.`);
                        return;
                    }

                    // 3. Send the message content
                    await channel.send(messageOptions);

                } catch (err) {
                    // Log errors specific to processing a single guild without stopping others
                    console.error(`Error processing guild ${guildId}:`, err);
                }
            });

            await Promise.all(promises);
            console.log(`Successfully attempted to display daily blurb in ${promises.length} guilds.`);
            
        } catch (err) {
            console.error('Fatal error in displayBlurb:', err);
        }
    };

    // We are removing the old DynamoDB/AWS dependencies.
};
