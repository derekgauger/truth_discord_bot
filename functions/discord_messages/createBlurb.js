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


// Helper function to format a historical fact item for Discord.
// It includes a clickable link if one is present (the "Learn More" functionality).
function formatFact(item) {
    const factText = `${item.year} - ${item.fact}`;

    if (item.link) {
        // Discord markdown for a link: [text](url) - serves as the (Learn More)
        return `${factText} ([Learn More](${item.link}))`;
    }
    return `${factText}`;
}

module.exports = (client) => {
    /**
     * Fetches today's content from Firestore and formats it into a single
     * rich Discord message string (the "blurb").
     * @returns {Promise<string>} The formatted Discord message.
     */
    client.createBlurb = async () => {
        try {
            const today = new Date();
            // Format date to YYYY-MM-DD to match the document ID from the Python ingestion script
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const today_str_for_doc_id = `${today.getFullYear()}-${month}-${day}`;
            
            // Reference the specific document for today
            // Note: Admin SDK uses .doc().get() instead of doc().getDoc()
            const docRef = db.collection(FIRESTORE_DAILY_COLLECTION).doc(today_str_for_doc_id);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                console.log(`No daily content found for ${today_str_for_doc_id}.`);
                return "I could not find the facts for today. The daily facts ingestion might not have run yet. Please check again later!";
            }

            const data = docSnap.data();
            const { events, births, deaths, national_days } = data;
            
            // Format events into a paragraph
            const eventText = events.sort(() => 0.5 - Math.random()).slice(0, 3).sort((a, b) => b.year - a.year).map(event => formatFact(event)).join('. ');
            let blurb = `${eventText}.\n\n`;
            
            return blurb.trim();

        } catch (error) {
            console.error("Error generating blurb from Firestore:", error);
            return "I encountered an internal error trying to fetch the daily truth. Please check the logs.";
        }
    }
}
