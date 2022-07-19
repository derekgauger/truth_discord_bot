"""
This script is used for the 'Truth Discord Bot'. It gathers all the fun national days from the website
'https://nationaldaycalendar.com/' and puts them in a JSON file.

In the Truth bot Javascript code, it will read the JSON file and print all current national days on Discord
for everyone to see.

Pip libraries needed: requests
"""


import requests
import re
import html
import unicodedata
import json

months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
# months = ["January"]

# Get the HTML and puts it into a text file
def get_webpage(month):
    r = requests.get("https://nationaldaycalendar.com/{}".format(month))

    with open('page.txt', 'w') as f:
        f.write(r.text)


# Gets the holidays from the html file by scraping through the html
def get_holidays(month):
    get_webpage(month)
    
    # Get text file lines
    with open('page.txt') as f:
        lines = f.readlines()

    # Get holidays by checking each line for the holiday entry formats
    matches = []
    for line in lines:
        match = match2 = None
        if "<li>" in line:
            match = re.search(r'<li>.* {} (\d+).*">(.*)</a>.*</li>'.format(month), line)
            match2 = re.search(r'<li>.*{}-(\d+)/">(.*)</a>.*</li>'.format(month.lower()), line)
        if match:
            matches.append(match.groups())
        elif match2:
            matches.append(match2.groups())

    # Create dictionary that contains holidays for each day
    holidays = {}
    for match in matches:
        day = match[0]
        holiday = match[1]
        holiday = html.unescape(holiday)
        holiday = unicodedata.normalize('NFKD', holiday).encode('ascii', 'ignore').decode()
        if len(holiday) > 3:
            if day in holidays:
                holidays[day].append(holiday)
            else:
                holidays[day] = [holiday]

    return holidays


# main
def main():
    dict = {}
    for month in months:
        holidays = get_holidays(month)
        dict[month] = holidays

    with open("holidays.json", "w") as f:
        json_object = json.dumps(dict, indent=4)
        f.write(json_object)        

main()
