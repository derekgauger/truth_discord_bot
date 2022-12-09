from locale import currency
from bs4 import BeautifulSoup
import requests
import re
from datetime import datetime
import json


today = datetime.now()

current_month = today.strftime('%B')
current_day = str(int(today.strftime("%d")))

# TODAY_URL = "https://nationaltoday.com/what-is-today/"
TODAY_URL = "https://nationaltoday.com/{}-{}-holidays/".format(current_month.lower(), current_day)
PATH_TO_JSON = "/home/ubuntu/truth_discord_bot/national_days.json"
PATH_TO_TXT = "/home/ubuntu/truth_discord_bot/national_day_blurb.txt"
# PATH_TO_JSON = "./national_days.json"
# PATH_TO_TXT = "./national_day_blurb.txt"


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


def get_national_day_blurb():
    retVal = None
    html_document = get_HTML_document(TODAY_URL)
    soup = BeautifulSoup(html_document, 'html.parser')
    for i in soup.find_all('p'):
        paragraph = HTML_to_ascii(i.text)
        if paragraph.startswith("{} {}".format(current_month, current_day)):
            retVal = paragraph
            break
    
    return retVal
    

def main():
    date_dict_today = create_national_day_dictionary()
    day_blurb = get_national_day_blurb()

    if day_blurb:
        open(PATH_TO_TXT, 'w').write(day_blurb)
    else:
        open(PATH_TO_TXT, 'w').write("I have no fun facts for today. Maybe I will have some tomorrow. Who knows :)")

    open(PATH_TO_JSON, 'w').write(json.dumps(date_dict_today, indent=4))

main()
