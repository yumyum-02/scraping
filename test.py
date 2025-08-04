import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

url = "https://befriend.co.jp/"
r = requests.get(url)
time.sleep(3)

soup = BeautifulSoup(r.text, "html.parser")
get_title = soup.find_all("h2")
print(get_title)