from bs4 import BeautifulSoup
import requests
import re
from datetime import datetime
import json

today = datetime.now()

current_month = today.strftime('%B')
current_day = today.strftime("%d")

date_dict = {}
date_dict[current_month] = {}
date_dict[current_month][str(int(current_day))] = []

def getHTMLdocument(url):
    response = requests.get(url)
    return response.text

def HTMLtoAscii(text):
    return str(text.encode('ascii', 'ignore').decode('utf-8'))

url = "https://nationaldaycalendar.com/what-day-is-it/"

html_document = getHTMLdocument(url)

soup = BeautifulSoup(html_document, 'html.parser')

for span in soup.find_all('span', attrs={'class': re.compile("^evcal_desc2 evcal_event_title")}):
    matches = re.search(r">(.*)</", str(span))
    if matches:
        date_dict[current_month][str(int(current_day))].append(HTMLtoAscii(matches.groups()[0]))

with open('national_days.json', 'w') as f:
    f.write(json.dumps(date_dict, indent=4))