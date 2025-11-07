import functions_framework
import requests
from datetime import datetime, timedelta
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


def get_national_days_with_fallback(days_url1, days_url2, days_url3):
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
        
    days_html_content3 = get_html_content(days_url3)
    if days_html_content3:
        national_days = scrape_text_by_element_and_class(
            days_html_content3, DAYS_ELEM_TYPE, DAYS_CLASS, True
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
        
    if days_html_content3:
        national_days = scrape_text_by_element_and_class(
            days_html_content3, DAYS_ELEM_TYPE, DAYS_CLASS2, True
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
        link = item.get("links", [])
        first_link = (
            link[0].get("link") if link and link[0] and link[0].get("link") else ""
        )

        transformed_list.append(
            {
                "year": item.get("year", ""),
                "fact": item.get("text", ""),
                "link": first_link,
            }
        )
    return transformed_list


# --- Function to handle ingestion for a single specific date ---
def ingest_single_day_content(db, target_date):
    """
    Fetches and stores daily content (History and National Days) for a specific date object.
    """
    today_str_for_doc_id = target_date.strftime("%Y-%m-%d")  # e.g., "2025-10-27"
    month_name = target_date.strftime(
        "%B"
    ).lower()  # e.g., "october" (for National Today)
    # Using #m for no leading zero on month number (e.g., 10 instead of 010)
    month_num = target_date.strftime("%#m")
    day = target_date.strftime("%d")  # e.g., "27"

    print(f"\nProcessing date: {today_str_for_doc_id}")

    # Initialize data lists
    events_list = []
    births_list = []
    deaths_list = []
    national_days_list = []

    # --- 1. Fetch Today in History (Muffinlabs API) ---
    # Using the specific month/day parameters based on your request
    muffinlabs_api_url = f"https://history.muffinlabs.com/date/{month_num}/{day}"
    print(f"Fetching historical data from {muffinlabs_api_url}...")

    try:
        response = requests.get(muffinlabs_api_url)
        response.raise_for_status()
        history_data = response.json()

        # Muffinlabs API uses keys like 'Events', 'Births', 'Deaths'
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
    except Exception as e:
        print(f"An unexpected error occurred during Muffinlabs processing: {e}")

    # --- 2. Fetch National Days (Web Scraping) ---
    days_url1 = f"https://nationaltoday.com/{month_name}-{day}/"
    days_url2 = f"https://nationaltoday.com/{month_name}-{int(day)}/"
    days_url3 = "https://nationaltoday.com/today/"
    print(f"Attempting to scrape national days from {days_url1} and {days_url2} and {days_url3}...")

    try:
        national_days_list = get_national_days_with_fallback(days_url1, days_url2, days_url3)
        print(f"Successfully scraped {len(national_days_list)} national days.")
    except Exception as e:
        print(f"An error occurred during national days scraping: {e}")

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
            print(f"Successfully stored daily content for {today_str_for_doc_id}.")
            return f"Ingestion complete for {today_str_for_doc_id}"
        except Exception as e:
            print(f"Error storing data for {today_str_for_doc_id} in Firestore: {e}")
            return f"Error during Firestore storage for {today_str_for_doc_id}: {e}"
    else:
        print(f"No data fetched for {today_str_for_doc_id}.")
        return f"No data fetched for {today_str_for_doc_id}."


@functions_framework.http
def ingest_daily_content(request):
    """
    HTTP Cloud Function that fetches and stores daily content for TODAY and the next two days.
    This provides a 3-day buffer in Firestore.
    """
    print("Starting 3-day daily content ingestion...")

    # Initialize Firestore client
    db = firestore.Client()
    results = []

    # Get the starting date (datetime.now() uses the Cloud Function's default timezone, usually UTC)
    today = datetime.now()

    # Loop for today (0), tomorrow (1), and the day after tomorrow (2)
    for i in range(3):
        target_date = today + timedelta(days=i)

        # Call the refactored function to process and store data for the target date
        result = ingest_single_day_content(db, target_date)
        results.append(result)

    final_message = f"3-Day Ingestion complete. Results: [{'; '.join(results)}]"
    print(final_message)
    return final_message, 200
