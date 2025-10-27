const { EmbedBuilder } = require('discord.js');
// Note: This module now uses the Firebase Admin SDK, which is necessary for
// service account initialization outside of client-side environments.

// // !!! ACTION REQUIRED: Run 'npm install firebase-admin' !!!
const admin = require("firebase-admin");

// --- Configuration Variables for Easy Hookups ---
const FIRESTORE_DAILY_COLLECTION = "daily-content";
// Note: The FIREBASE_APP_NAME variable is no longer needed with Admin SDK's default initialization.

// --- Firebase Initialization (via Service Account or Environment) ---

/**
 * Initializes the Firebase Admin SDK.
 * * For local testing, ensure you have completed the following steps:
 * 1. Install the SDK: npm install firebase-admin
 * 2. Download your Service Account JSON key from the Firebase Console (Settings -> Service accounts).
 * 3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of that JSON file.
 * * E.g., in Windows PowerShell: 
 * $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"
 */

try {
    // Initialize without arguments. Admin SDK will automatically look for
    // credentials via GOOGLE_APPLICATION_CREDENTIALS env var or other GCP defaults.
    admin.initializeApp();
} catch (e) {
    // The Admin SDK throws an error if the app is already initialized, which is common.
    // We safely ignore this specific error.
    if (!/already exists/.test(e.message)) {
        console.error("Firebase Admin SDK Initialization Error:", e);
        throw e;
    }
}

// Get the Firestore database instance from the initialized app
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