import functions_framework
import requests
from datetime import datetime
from google.cloud import firestore
from bs4 import BeautifulSoup

# --- Configuration ---
FIRESTORE_DAILY_COLLECTION = "daily-content"  # Name of the Firestore collection

# --- Constants for Web Scraping Logic ---
ARTICLES = ["the", "a", "an"]
PREPOSITIONS = [
    "in",
    "on",
    "at",
    "by",
    "with",
    "for",
    "of",
    "to",
    "from",
    "over",
    "under",
    "between",
    "among",
    "through",
    "around",
]
CONJUNCTIONS = ["and", "but", "or", "so", "yet", "for", "nor"]

DAYS_ELEM_TYPE = "h3"
DAYS_CLASS = "card-holiday-title"
DAYS_CLASS2 = "holiday-title"

def HTML_to_ascii(text):
    """Encodes HTML content to ASCII, ignoring non-ASCII characters."""
    return str(text.encode("ascii", "ignore").decode("utf-8"))


def get_html_content(url):
    """Fetches HTML content from a URL using requests."""
    try:
        # Use exponential backoff for robustness, although not fully implemented here,
        # it's good practice for Cloud Functions that rely on external APIs/sites.
        response = requests.get(url, timeout=10)  # Set a timeout for external requests
        response.raise_for_status()
        html_content = response.text
        return HTML_to_ascii(html_content)
    except requests.exceptions.RequestException as e:
        # Print error but return empty string to allow function to continue with fallbacks
        print(f"Error fetching the page {url}: {e}")
        return ""


def standardize_capitalization(text_list):
    """Capitalizes the first letter of each word, skipping certain small words."""

    def is_excluded(word):
        return word in ARTICLES or word in PREPOSITIONS or word in CONJUNCTIONS

    for i, text in enumerate(text_list):
        words = text.split()
        for j, word in enumerate(words):
            lower_word = word.lower()
            if is_excluded(lower_word) and j != 0:
                words[j] = lower_word
            else:
                # Capitalize first letter
                if word:
                    words[j] = word[0].upper() + word[1:].lower()
        text_list[i] = " ".join(words)
    return text_list


def scrape_text_by_element_and_class(
    html_content, element_type, class_name, is_national_days=False
):
    """Extracts text content from HTML based on element type and CSS class."""
    soup = BeautifulSoup(html_content, "html.parser")
    elements = soup.find_all(element_type, class_=class_name)
    text_list = [element.get_text() for element in elements]

    if is_national_days:
        text_list = standardize_capitalization(text_list)

    return text_list


def get_national_days_with_fallback(days_url1, days_url2):
    """
    Tries to get national days from National Today using multiple URLs and class names.
    Returns a list of national days or an empty list if all attempts fail.
    """
    # Attempt 1: Specific date URL with first class
    days_html_content = get_html_content(days_url1)
    if days_html_content:
        national_days = scrape_text_by_element_and_class(
            days_html_content, DAYS_ELEM_TYPE, DAYS_CLASS, True
        )
        if national_days:
            return national_days

    # Attempt 2: General "Today" URL with first class
    days_html_content2 = get_html_content(days_url2)
    if days_html_content2:
        national_days = scrape_text_by_element_and_class(
            days_html_content2, DAYS_ELEM_TYPE, DAYS_CLASS, True
        )
        if national_days:
            return national_days

    # Attempt 3: Specific date URL with second class (if content available)
    if days_html_content:
        national_days = scrape_text_by_element_and_class(
            days_html_content, DAYS_ELEM_TYPE, DAYS_CLASS2, True
        )
        if national_days:
            return national_days

    # Attempt 4: General "Today" URL with second class (if content available)
    if days_html_content2:
        national_days = scrape_text_by_element_and_class(
            days_html_content2, DAYS_ELEM_TYPE, DAYS_CLASS2, True
        )
        if national_days:
            return national_days

    # If all attempts failed
    return []

# --- Custom Helper to Transform Muffinlabs Data ---
def transform_history_data(data_list):
    """
    Transforms the Muffinlabs list of objects into the desired Firestore format.
    Muffinlabs structure: [{'year': 'YYYY', 'text': '...', 'links': [{'title': '...', 'link': '...'}]}]
    Desired structure: [{'year': 'YYYY', 'fact': '...', 'link': '...'}]
    """
    transformed_list = []
    for item in data_list:
        # Safely extract the link if it exists. Muffinlabs puts links in an array, 
        # so we take the first one if the array is present and has elements.
        link = item.get('links', [])
        first_link = link[0].get('link') if link and link[0] and link[0].get('link') else ""
        
        transformed_list.append({
            "year": item.get('year', ''),
            "fact": item.get('text', ''),
            "link": first_link
        })
    return transformed_list


@functions_framework.http
def ingest_daily_content(request):
    """
    HTTP Cloud Function that fetches "Today in History" facts from Muffinlabs API
      AND "National Days" from nationaltoday.com, then stores them in Firestore
      in the new structured format.
    """
    print("Starting daily content ingestion (Muffinlabs and National Today)...")

    # Initialize Firestore client
    db = firestore.Client()

    today = datetime.now()
    today_str_for_doc_id = today.strftime("%Y-%m-%d")  # e.g., "2023-10-27"
    month = today.strftime("%B").lower()
    day = today.strftime("%d")

    # Initialize data lists
    events_list = []
    births_list = []
    deaths_list = []
    national_days_list = []

    # --- 1. Fetch Today in History (Muffinlabs API) ---
    muffinlabs_api_url = f"https://history.muffinlabs.com/date"
    print(f"Fetching historical data from {muffinlabs_api_url}...")

    try:
        response = requests.get(muffinlabs_api_url)
        response.raise_for_status()
        history_data = response.json()

        if "data" in history_data and history_data["data"]:
            if "Events" in history_data["data"]:
                events_list = transform_history_data(history_data["data"]["Events"])

            if "Births" in history_data["data"]:
                births_list = transform_history_data(history_data["data"]["Births"])

            if "Deaths" in history_data["data"]:
                deaths_list = transform_history_data(history_data["data"]["Deaths"])

            print(
                f"Successfully fetched {len(events_list)} events, {len(births_list)} births, {len(deaths_list)} deaths from Muffinlabs."
            )

    except requests.exceptions.RequestException as e:
        print(f"Error fetching Today in History from Muffinlabs: {e}")
        # Continue execution to attempt national days scraping even if history fails
    except Exception as e:
        print(f"An unexpected error occurred during Muffinlabs processing: {e}")
        # Continue execution

    # --- 2. Fetch National Days (Web Scraping) ---
    days_url1 = f"https://nationaltoday.com/{month}-{day}/"
    days_url2 = "https://nationaltoday.com/today/"
    print(f"Attempting to scrape national days from {days_url1} and {days_url2}...")

    try:
        national_days_list = get_national_days_with_fallback(days_url1, days_url2)
        print(f"Successfully scraped {len(national_days_list)} national days.")
    except Exception as e:
        print(f"An error occurred during national days scraping: {e}")
        # Continue execution with an empty list

    # --- 3. Store in Firestore ---

    # Only store if any data was fetched for any category
    if events_list or births_list or deaths_list or national_days_list:
        document_data = {
            "date": today_str_for_doc_id,
            "events": events_list,
            "births": births_list,
            "deaths": deaths_list,
            "national_days": national_days_list,
            "last_updated": firestore.SERVER_TIMESTAMP,
        }

        try:
            doc_ref = db.collection(FIRESTORE_DAILY_COLLECTION).document(
                today_str_for_doc_id
            )
            # Use set(..., merge=True) to safely update/create the document
            doc_ref.set(document_data, merge=True)
            print(
                f"Successfully stored daily content for {today_str_for_doc_id} in Firestore (Historical facts + National Days)."
            )
            return (
                f"Daily content ingestion complete for {today_str_for_doc_id}. Days: {len(national_days_list)}",
                200,
            )
        except Exception as e:
            print(f"Error storing data in Firestore: {e}")
            return f"Error during Firestore storage: {e}", 500
    else:
        print("No data (historical or national days) fetched to store in Firestore.")
        return "No data fetched, nothing to store.", 200