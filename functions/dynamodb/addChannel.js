const admin = require("firebase-admin");

// --- Configuration Constant ---
const FIRESTORE_CHANNEL_COLLECTION = "discord-channels";


// --- Firebase Initialization (via Service Account or Environment) ---
// Note: This block ensures the Admin SDK is initialized once.
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
     * Registers a Discord channel ID to a Guild ID in Firestore for automated messages.
     * It uses the Guild ID as the document ID for efficient lookup.
     * @param {string} guildName - The name of the Discord guild (server).
     * @param {string} guildId - The unique ID of the Discord guild.
     * @param {string} channelId - The ID of the channel where the blurb should be posted.
     * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
     */
    client.addChannel = async (guildName, guildId, channelId) => {
        if (!guildName || !guildId || !channelId) {
            return Promise.reject(new Error('Missing required parameters: guildName, guildId, or channelId'));
        }

        try {
            const docRef = db.collection(FIRESTORE_CHANNEL_COLLECTION).doc(guildId);
            const item = {
                name: guildName,
                channelId: channelId,
                created_on: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Use set() with merge: true to update the document if it exists, or create it if it doesn't (upsert behavior).
            await docRef.set(item, { merge: true });

            console.log(`Server: '${guildName}' has been added/updated in Firestore`);
            return `Server: '${guildName}' has been successfully configured to channel ${channelId}.`;
        } catch (error) {
            console.error(`Error configuring server '${guildName}' in Firestore:`, error);
            return Promise.reject(new Error(`Unable to save record for server '${guildName}'. Error: ${error.message}`));
        }
    };
};
