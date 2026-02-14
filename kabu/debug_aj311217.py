import requests
import json
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def debug_json(code):
    url = f"https://finance.yahoo.co.jp/quote/{code}/chart"
    print(f"Fetching {url}...")
    
    res = requests.get(url, headers=headers, timeout=10)
    if res.status_code != 200:
        print(f"Failed to fetch: {res.status_code}")
        return

    soup = BeautifulSoup(res.text, 'html.parser')
    scripts = soup.find_all('script')
    
    target_json = None
    for s in scripts:
        if s.string and "window.__PRELOADED_STATE__" in s.string:
            try:
                json_str = s.string.split("window.__PRELOADED_STATE__ = ")[1].split(";")[0]
                target_json = json.loads(json_str)
                break
            except Exception as e:
                print(f"JSON parse error: {e}")

    if not target_json:
        print("No PRELOADED_STATE found.")
        return

    print(f"Top keys: {list(target_json.keys())}")
    
    if 'mainYJChart' in target_json:
        print("\n--- mainYJChart ---")
        chart = target_json['mainYJChart']
        print(f"Keys: {chart.keys()}")
        if 'chart' in chart:
            c = chart['chart']
            print(f"Chart Keys: {c.keys()}")
            if 'chartLine' in c:
                print(f"chartLine: {c['chartLine']}")
        else:
            print("No 'chart' key in mainYJChart")
    if 'mainFundPriceBoard' in target_json:
        print("\n--- mainFundPriceBoard ---")
        pb = target_json['mainFundPriceBoard']
        print(f"Keys: {pb.keys()}")
        print(pb)

    if 'mainFundDetail' in target_json:
        print("\n--- mainFundDetail ---")
        fd = target_json['mainFundDetail']
        print(f"Keys: {fd.keys()}")


debug_json("AJ311217")
