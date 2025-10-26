import functions_framework
import requests
from datetime import datetime
from google.cloud import firestore
import os

# --- Configuration ---
FIRESTORE_DAILY_COLLECTION = "daily-content"  # Name of the Firestore collection


@functions_framework.http
def ingest_daily_content(request):
    """
    HTTP Cloud Function that fetches "Today in History" facts from Muffinlabs API
    and stores them in Firestore with a structured format (events, births, deaths).
    """
    print("Starting Muffinlabs facts ingestion...")
    # Initialize Firestore client globally.
    db = firestore.Client()

    today = datetime.now()
    today_str_for_doc_id = today.strftime("%Y-%m-%d")  # e.g., "2023-10-27"

    # Initialize separate lists for each type of fact
    events_list = []
    births_list = []
    deaths_list = []  # Adding deaths as requested

    muffinlabs_api_url = f"https://history.muffinlabs.com/date"

    try:
        print(f"Fetching data from {muffinlabs_api_url}...")
        response = requests.get(muffinlabs_api_url)
        response.raise_for_status()  # Raises HTTPError for bad responses (4xx or 5xx)
        history_data = response.json()

        if "data" in history_data and history_data["data"]:
            # Extract Events
            if "Events" in history_data["data"]:
                for event in history_data["data"][
                    "Events"
                ]:  # Get all events, not just top 5
                    events_list.append(f"{event['year']}: {event['text']}")
            # Extract Births
            if "Births" in history_data["data"]:
                for birth in history_data["data"]["Births"]:  # Get all births
                    births_list.append(f"{birth['year']}: {birth['text']}")
            # Extract Deaths
            if "Deaths" in history_data["data"]:  # Now specifically extracting deaths
                for death in history_data["data"]["Deaths"]:  # Get all deaths
                    deaths_list.append(f"{death['year']}: {death['text']}")

            print(
                f"Successfully fetched {len(events_list)} events, {len(births_list)} births, {len(deaths_list)} deaths."
            )

    except requests.exceptions.RequestException as e:
        print(f"Error fetching Today in History from Muffinlabs: {e}")
        return f"Error fetching Muffinlabs data: {e}", 500
    except ValueError:  # JSONDecodeError for requests.json()
        print(
            f"Error decoding JSON from Muffinlabs API. Response content: {response.text[:200]}..."
        )
        return "Error decoding Muffinlabs API response", 500
    except KeyError as e:
        print(
            f"Key error in Muffinlabs response structure: {e}. Data received: {history_data}"
        )
        return f"Unexpected Muffinlabs data structure: {e}", 500
    except Exception as e:
        print(f"An unexpected error occurred during Muffinlabs processing: {e}")
        return f"An unexpected error occurred: {e}", 500

        # --- Store in Firestore ---
        # Only store if any data was fetched for any category
    if events_list or births_list or deaths_list:
        document_data = {
            "date": today_str_for_doc_id,  # Keep date as a field too, good for queries
            "events": events_list,
            "births": births_list,
            "deaths": deaths_list,
            "last_updated": firestore.SERVER_TIMESTAMP,
        }

        try:
            doc_ref = db.collection(FIRESTORE_DAILY_COLLECTION).document(
                today_str_for_doc_id
            )
            # Using set(..., merge=True) is still good here. If we later add national_days
            # to this document, it will combine nicely without overwriting.
            doc_ref.set(document_data, merge=True)
            print(
                f"Successfully stored Muffinlabs facts for {today_str_for_doc_id} in Firestore."
            )
            return (
                f"Muffinlabs facts ingestion complete for {today_str_for_doc_id}.",
                200,
            )
        except Exception as e:
            print(f"Error storing data in Firestore: {e}")
            return f"Error during Firestore storage: {e}", 500
    else:
        print("No historical facts fetched to store in Firestore.")
        return "No historical facts fetched, nothing to store.", 200
