import requests
import json
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def find_json_data(code):
    url = f"https://finance.yahoo.co.jp/quote/{code}/chart"
    print(f"Fetching {url} to find JSON...")
    
    res = requests.get(url, headers=headers, timeout=10)
    if res.status_code != 200:
        print("Failed to fetch.")
        return

    soup = BeautifulSoup(res.text, 'html.parser')
    scripts = soup.find_all('script')
    
    found_data = False
    for i, s in enumerate(scripts):
        if s.string and "window.__PRELOADED_STATE__" in s.string:
            print(f"--- Script {i} has PRELOADED_STATE ---")
            try:
                # Extract JSON string
                json_str = s.string.split("window.__PRELOADED_STATE__ = ")[1].split(";")[0]
                data = json.loads(json_str)
                found_data = True
                
                if 'mainHistoryTermChange' in data:
                     print(f"--- mainHistoryTermChange ---")
                     term_change = data['mainHistoryTermChange']
                     if 'termAndTimeFrameChange' in term_change:
                         ttc = term_change['termAndTimeFrameChange']
                         print(f"termAndTimeFrameChange keys: {ttc.keys()}")
                         # Dump it to see if there are URLs
                         print(json.dumps(ttc, indent=2)[:1000])

                if 'mainYJChart' in data:
                    print(f"--- mainYJChart keys ---")
                    print(data['mainYJChart'].keys())
                    
            except Exception as e:
                print(f"JSON Parse Error: {e}")
            break
    
    if not found_data:
        print("No PRELOADED_STATE found.")

find_json_data("AJ312217")
