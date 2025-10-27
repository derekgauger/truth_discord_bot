const admin = require("firebase-admin");

const FIRESTORE_CHANNEL_COLLECTION = "discord-channels";
const db = admin.firestore();


module.exports = (client) => {
    /**
     * Removes a Discord channel configuration for a Guild ID from Firestore.
     * @param {string} guildId - The unique ID of the Discord guild.
     * @param {string} guildName - The name of the Discord guild (for logging/messages).
     * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
     */
    client.removeChannel = async (guildId, guildName) => {
        if (!guildId || !guildName) {
            throw new Error('Missing required parameters: guildId or guildName');
        }

        try {
            const docRef = db.collection(FIRESTORE_CHANNEL_COLLECTION).doc(guildId);
            
            // Delete the document from Firestore
            await docRef.delete();

            console.log(`Server: '${guildName}' has been removed from Firestore`);
            return `Server: '${guildName}' has been successfully removed from the database.`;
        } catch (error) {
            console.error(`Error removing server '${guildName}' from Firestore:`, error);
            // Throw a new error for external handling
            throw new Error(`Unable to delete the record for server '${guildName}'. Error: ${error.message}`);
        }
    };
};
