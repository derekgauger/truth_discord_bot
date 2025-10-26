import requests
import os
from datetime import date
from bs4 import BeautifulSoup

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

MAX_DAYS = 15

# DATE_TODAY = date.today().strftime('%B-%d').lower() # e.g. "january-01"
MONTH = date.today().strftime("%B").lower()
DAYS = int(date.today().strftime("%d"))
DAYS_URL = f"https://nationaltoday.com/{MONTH}-{DAYS}/"
DAYS_URL2 = "https://nationaltoday.com/today/"

directory = os.path.dirname(__file__)
list_starter = "-"

DAYS_STORAGE_PATH = directory + "/national_days.txt"

BLANK_OUTPUT_ERROR_MSG = "Something probably went wrong... Please contact your local idiot who made this script: 'dirkyg'."


def remove_duplicates(list_of_stuff):
    non_dupes = []
    for item in list_of_stuff:
        if item not in non_dupes:
            non_dupes.append(item)
    return non_dupes


def HTML_to_ascii(text):
    return str(text.encode("ascii", "ignore").decode("utf-8"))


def get_html_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        html_content = response.text
        return HTML_to_ascii(html_content)
    except requests.exceptions.RequestException as e:
        print("Error fetching the page: {}".format(e))
        return ""


def standardize_capitalization(text_list):
    def is_excluded(word):
        return word in ARTICLES or word in PREPOSITIONS or word in CONJUNCTIONS

    for i, text in enumerate(text_list):
        words = text.split()
        for j, word in enumerate(words):
            lower_word = word.lower()
            if is_excluded(lower_word) and j != 0:
                words[j] = lower_word
            else:
                words[j] = word[0].upper() + word[1:].lower()
        text_list[i] = " ".join(words)
    return text_list


def scrape_text_by_element_and_class(
    html_content, element_type, class_name, is_national_days=False
):
    soup = BeautifulSoup(html_content, "html.parser")
    elements = soup.find_all(element_type, class_=class_name)
    text_list = [element.get_text() for element in elements]

    if is_national_days:
        text_list = standardize_capitalization(text_list)

    return text_list


def get_national_days_with_fallback():
    """
    Tries to get national days from multiple sources with fallback logic.
    Returns a list of national days or empty list if all sources fail.
    """
    # Try first URL with first class
    days_html_content = get_html_content(DAYS_URL)
    if days_html_content:
        national_days = scrape_text_by_element_and_class(
            days_html_content, DAYS_ELEM_TYPE, DAYS_CLASS, True
        )[:MAX_DAYS]

        if national_days:  # If we found results, return them
            return national_days

    # Try second URL with first class
    days_html_content2 = get_html_content(DAYS_URL2)
    if days_html_content2:
        national_days = scrape_text_by_element_and_class(
            days_html_content2, DAYS_ELEM_TYPE, DAYS_CLASS, True
        )[:MAX_DAYS]

        if national_days:  # If we found results, return them
            return national_days

    # Try first URL with second class
    if days_html_content:
        national_days = scrape_text_by_element_and_class(
            days_html_content, DAYS_ELEM_TYPE, DAYS_CLASS2, True
        )[:MAX_DAYS]

        if national_days:  # If we found results, return them
            return national_days

    # Try second URL with second class
    if days_html_content2:
        national_days = scrape_text_by_element_and_class(
            days_html_content2, DAYS_ELEM_TYPE, DAYS_CLASS2, True
        )[:MAX_DAYS]

        if national_days:  # If we found results, return them
            return national_days

    # If all attempts failed, return empty list
    return []


if __name__ == "__main__":
    national_days = get_national_days_with_fallback()

    if not national_days:
        with open(DAYS_STORAGE_PATH, "w") as days_file:
            days_file.write(
                "Something went wrong, please contact 'dirkyg' on Discord!\n"
            )
    else:
        with open(DAYS_STORAGE_PATH, "w") as days_file:
            for i, day in enumerate(national_days):
                list_starter = "{}.".format(i + 1)
                days_file.write("{} {}\n".format(list_starter, day))
