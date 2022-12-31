from bs4 import BeautifulSoup
import requests
import re
from datetime import datetime
import os


today = datetime.now()

current_month = today.strftime('%B')
current_day = str(int(today.strftime("%d")))

# TODAY_URL = "https://nationaltoday.com/what-is-today/"
TODAY_URL = "https://nationaltoday.com/{}-{}-holidays/".format(current_month.lower(), current_day)
FACTS_URL = "https://www.factmonster.com/dayinhistory/{}-{}".format(current_month.lower(), today.strftime("%d"))
PATH_TO_DAYS = "/home/ubuntu/truth_discord_bot/national_days.txt"
PATH_TO_BLURB = "/home/ubuntu/truth_discord_bot/national_day_blurb.txt"
# PATH_TO_DAYS = "./national_days.txt"
# PATH_TO_BLURB = "./national_day_blurb.txt"


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


def create_national_day_list():

    day_list = []

    html_document = get_HTML_document(TODAY_URL)
    soup = BeautifulSoup(html_document, 'html.parser')

    for i in remove_duplicates(soup.find_all('h3', attrs={'class': re.compile("^holiday-title")})):
        title = HTML_to_ascii(i.text)
        if not "birthday" in title.lower():

            day_list.append(title)

    return day_list


def get_national_day_blurb():
    retVal = "On {} {}, the following things occured:\n".format(current_month, current_day)
    html_document = get_HTML_document(FACTS_URL)
    soup = BeautifulSoup(html_document, 'html.parser')
    for i in soup.find_all('ul', {"class": "features links"}):
        for j in i:
            paragraph = HTML_to_ascii(j.text)
            retVal += " - {}\n".format(paragraph)
            
    return retVal


def format_day_list(day_list):
    retVal = ""
    for title in day_list:
        retVal += " - {}\n".format(title)
    
    return retVal
    

def main():
    day_list = create_national_day_list()
    day_blurb = get_national_day_blurb()

    if not os.path.exists(PATH_TO_BLURB):
        open(PATH_TO_BLURB, "x")
    
    if not os.path.exists(PATH_TO_DAYS):
        open(PATH_TO_DAYS, 'x')

    open(PATH_TO_BLURB, 'w').write(day_blurb)
    open(PATH_TO_DAYS, 'w').write(format_day_list(day_list))

main()
