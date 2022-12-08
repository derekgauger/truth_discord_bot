from locale import currency
from bs4 import BeautifulSoup
import requests
import re
from datetime import datetime
import json


TODAY_URL = "https://nationaltoday.com/what-is-today/"
PATH_TO_JSON = "/home/ubunut/truth_discord_bot/national_days.json"
# PATH_TO_JSON = "./national_days.json"


def get_HTML_document(url):
    response = requests.get(url)
    return response.text


def HTML_to_ascii(text):
    return str(text.encode('ascii', 'ignore').decode('utf-8'))


def remove_duplicates(list):
    filtered_list =  []
    for element in list:
        if element not in filtered_list:
            filtered_list.append(element)

    return  filtered_list


def create_national_day_dictionary():

    today = datetime.now()

    current_month = today.strftime('%B')
    current_day = today.strftime("%d")
    current_day = str(int(current_day))

    date_dict = {}
    date_dict[current_month] = {}
    date_dict[current_month][current_day] = []

    html_document = get_HTML_document(TODAY_URL)
    soup = BeautifulSoup(html_document, 'html.parser')

    for i in remove_duplicates(soup.find_all('h3', attrs={'class': re.compile("^holiday-title")})):
        title = HTML_to_ascii(i.text)
        if not "birthday" in title.lower():
            date_dict[current_month][current_day].append(title)

    return date_dict

def main():

    date_dict_today = create_national_day_dictionary()

    open(PATH_TO_JSON, 'w').write(json.dumps(date_dict_today, indent=4))

main()
