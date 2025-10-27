const admin = require("firebase-admin");

const FIRESTORE_DAILY_COLLECTION = "daily-content";
const db = admin.firestore();

function formatFact(item) {
    const factText = `${item.year} - ${item.fact}`;

    if (item.link) {
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
