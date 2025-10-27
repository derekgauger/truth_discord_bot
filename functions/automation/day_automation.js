// Note: This file name is changed to avoid collision if you keep the original.

const Discord = require('discord.js');
// The createDay function must be attached to the client instance, usually in your main bot file.

// The Admin SDK is initialized in the file containing client.createDay (e.g., blurb_automation.js)
// We need to import it to reference the EmbedBuilder type for checking.
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
     * from Firestore, and sends the daily message to that channel.
     */
    client.displayDays = async () => {
        try {
            const guild_id_list = client.guilds.cache.map(guild => guild.id);
            
            // Call the function that generates the embed or error string
            const messageResult = await client.createDay();

            // Prepare message options based on the return type
            let messageOptions = {};

            if (typeof messageResult === 'string') {
                // If it's a string, it's the error message from createDay
                console.error("Failed to generate Discord Embed: received error string.");
                messageOptions.content = messageResult; 
            } else if (messageResult instanceof Discord.EmbedBuilder) {
                // If it's an EmbedBuilder, it's the successful message content
                messageOptions.embeds = [messageResult];
            } else {
                 console.error("Failed to generate valid content (neither Embed nor string). Aborting display.");
                 return;
            }


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

                    // 3. Send the message content (either content or embeds)
                    await channel.send(messageOptions);

                } catch (err) {
                    // Log errors specific to processing a single guild without stopping others
                    console.error(`Error processing guild ${guildId}:`, err);
                }
            });

            await Promise.all(promises);
            console.log(`Successfully attempted to display daily content in ${promises.length} guilds.`);
            
        } catch (err) {
            console.error('Fatal error in displayDays:', err);
        }
    };
};
