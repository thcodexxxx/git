import requests
from bs4 import BeautifulSoup
import pandas as pd

def test_html_table(code):
    url = f"https://finance.yahoo.co.jp/quote/{code}/history"
    print(f"Fetching {url} for HTML table...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables.")
        
        for i, table in enumerate(tables):
            print(f"--- Table {i} ---")
            # Try parsing with pandas to be quick
            try:
                # Wrap table in str for pandas
                dfs = pd.read_html(str(table))
                if dfs:
                    print(dfs[0].head())
                    print(f"Rows: {len(dfs[0])}")
            except Exception as e:
                print(f"Pandas parse error: {e}")
                
            # Manual check for '日付' or 'Date'
            if "日付" in table.get_text():
                print("Table likely contains history data.")
            else:
                print("Table does not look like history.")
                
    except Exception as e:
        print(f"Request Error: {e}")

print("Testing AJ312217 (Gold Fund H-Arith)")
test_html_table("AJ312217")

print("\nTesting AJ311217 (Gold Fund H-None)")
test_html_table("AJ311217")
