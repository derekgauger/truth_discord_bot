const admin = require("firebase-admin");

const FIRESTORE_CHANNEL_COLLECTION = "discord-channels";
const db = admin.firestore();


module.exports = (client) => {
    /**
     * Checks if a channel configuration exists for a given Guild ID in Firestore.
     * @param {string} guildId - The unique ID of the Discord guild.
     * @returns {Promise<boolean>} A promise that resolves to true if the channel exists, false otherwise.
     */
    client.getChannel = async (guildId) => {
        if (!guildId) {
            throw new Error('Missing required parameter: guildId');
        }

        try {
            const docRef = db.collection(FIRESTORE_CHANNEL_COLLECTION).doc(guildId);
            const docSnap = await docRef.get();
            
            const exists = docSnap.exists;

            if (exists) {
                console.log(`Channel configuration found for guild ID: ${guildId}`);
            } else {
                console.log(`No channel configuration found for guild ID: ${guildId}`);
            }

            // Return true if the document exists, false otherwise.
            return exists;
        } catch (error) {
            console.error(`Error checking channel for guild ID ${guildId}:`, error);
            // Throw a new error to be caught by the calling function/command handler
            throw new Error(`Failed to check channel existence: ${error.message}`);
        }
    };
};
