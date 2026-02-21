# kabu Codebase Documentation for NotebookLM

## File: debug_aj311217.py

`python
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

`

## File: debug_html.py

`python
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

`

## File: debug_url.py

`python
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

`

## File: Dockerfile

`text
FROM python:3.9-slim

WORKDIR /app

# 必要なライブラリのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコピー
COPY . .

# Cloud Runのポート設定（$PORTを環境変数として受け取る）
CMD streamlit run stock_app.py --server.port=${PORT} --server.address=0.0.0.0
`

## File: import_data.txt

`txt
No.,分析日,銘柄コード,銘柄名,推奨時株価/時価総額,PER/PEG,判定
46,2026/02/15,4382,ＨＥＲＯＺ,"1,650円 / 248億円",19.5 / 0.61,新規
47,2026/02/15,6027,弁護士ドットコム,"3,150円 / 710億円",28.5 / 0.85,新規
48,2026/02/15,3993,ＰＫＳＨＡ,"3,850円 / 515億円",22.0 / 0.73,新規
49,2026/02/15,6361,荏原製作所,"2,850円 / 9,850億円",14.2 / 0.68,新規
50,2026/02/15,5032,ＡＮＹＣＯＬＯＲ,"2,450円 / 1,520億円",15.5 / 0.52,新規
`

## File: import_stock_data.py

`python
import pandas as pd
import yfinance as yf
import re
from datetime import datetime, timedelta
import os

INPUT_FILE = "import_data.txt"
OUTPUT_FILE = "portfolio_sub.csv"

def get_historical_price(ticker_symbol, target_date_str):
    """
    指定された日付の終値を取得する。
    該当日が休場日の場合は、それ以前の直近のデータを取得する。
    """
    try:
        # Convert format YYYY/MM/DD to datetime
        target_date = datetime.strptime(target_date_str, "%Y/%m/%d")
        
        # Determine start/end for yfinance
        # Fetch a range around the date to handle holidays efficiently
        start_date = target_date - timedelta(days=7)
        end_date = target_date + timedelta(days=1) # yfinance end is exclusive
        
        ticker = yf.Ticker(f"{ticker_symbol}.T")
        hist = ticker.history(start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
        
        if hist.empty:
            print(f"  Warning: No data found for {ticker_symbol} around {target_date_str}")
            return None
            
        # Filter for dates <= target_date
        # Ensure index is timezone-naive or matches comparison
        hist.index = pd.to_datetime(hist.index).date
        target_date_date = target_date.date()
        
        valid_hist = hist[hist.index <= target_date_date]
        
        if valid_hist.empty:
            print(f"  Warning: No data found <= {target_date_str} (Oldest: {hist.index.min()})")
            return None
            
        # Get the last row (nearest to target date)
        latest = valid_hist.iloc[-1]
        actual_date = valid_hist.index[-1]
        close_price = latest['Close']
        
        print(f"  Found price for {ticker_symbol}: {close_price:.0f} (Date: {actual_date})")
        return close_price
        
    except Exception as e:
        print(f"  Error fetching price for {ticker_symbol}: {e}")
        return None

def parse_line(line):
    """
    Parses a line like:
    1	2026/01/01	9216	ビーウィズ	1,980円 / 278億円	11.2 / 0.75	継続
    Returns: date, code, name
    """
    parts = re.split(r'\t|\s{2,}', line.strip()) # Split by tab or 2+ spaces
    parts = [p.strip() for p in parts if p.strip()]
    
    if len(parts) < 4:
        return None
        
    # Heuristic mapping based on observed format
    # parts[0] -> No
    # parts[1] -> Date
    # parts[2] -> Code
    # parts[3] -> Name
    
    date_str = parts[1]
    code = parts[2]
    name = parts[3]
    
    # Validation
    if not re.match(r'\d{4}/\d{2}/\d{2}', date_str):
        return None
    if not code.isdigit():
        return None
        
    return date_str, code, name

import csv

def main():
    print(f"=== Importing Stocks from {INPUT_FILE} ===")
    
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    new_stocks = []
    
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            # Use csv reader to handle quotes and commas automatically
            reader = csv.reader(f)
            
            # Skip header if it exists (heuristic: check if first cell is "No.")
            # We will iterate and check each row
            for row in reader:
                if not row: continue
                
                # Check for header or empty line
                if row[0].startswith("No") or row[0].startswith("#"):
                    continue
                    
                # Format: No., 分析日, 銘柄コード, 銘柄名, ...
                # Index: 0, 1, 2, 3
                if len(row) < 4:
                    continue
                
                date_str = row[1].strip()
                code = row[2].strip()
                name = row[3].strip()
                
                # Validation
                if not re.match(r'\d{4}/\d{2}/\d{2}', date_str):
                    print(f"Skipping invalid date format: {date_str} in row {row}")
                    continue
                if not code.isdigit():
                    print(f"Skipping invalid code: {code} in row {row}")
                    continue

                print(f"Processing: {code} {name} (Target: {date_str})")
                
                price = get_historical_price(code, date_str)
                if price is None:
                    print(f"Skipping {code} due to price fetch failure.")
                    continue
                    
                # Calculate shares to target 100,000 JPY
                shares = max(1, round(100000 / price))
                
                new_stocks.append({
                    "code": f"{code}.T",
                    "name": name,
                    "date": date_str.replace("/", "-"), # CSV format YYYY-MM-DD
                    "shares": shares,
                    "price": price
                })

    except Exception as e:
        print(f"Error reading input file: {e}")
        return

    if not new_stocks:
        print("No valid stocks found to import.")
        return

    print(f"\n=== Appending {len(new_stocks)} stocks to {OUTPUT_FILE} ===")
    
    try:
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            # Check if file has content and ends with newline
             # (Simple append, assuming file exists per prev context)
            for s in new_stocks:
                line = f"{s['code']},{s['name']},{s['date']},{s['shares']},{s['price']:.0f}"
                f.write(line + "\n")
                print(f"Appended: {line}")
        print("Done.")
    except Exception as e:
        print(f"Error writing to CSV: {e}")

if __name__ == "__main__":
    main()

`

## File: list_models.py

`python
import google.generativeai as genai
import os

GEMINI_API_KEY = "AIzaSyAjUet8Osta6J50Fm_9eOuHMsUSu0lrcHU"
genai.configure(api_key=GEMINI_API_KEY)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")

`

## File: portfolio.csv

`csv
ポートフォリオ,銘柄コード,銘柄名,購入日,保有株数,購入単価
メイン,7203.T,トヨタ自動車,2023-10-01,100,2600.0
メイン,9984.T,ソフトバンクG,2023-11-15,200,6200.0
サブ(成長株),NVDA,NVIDIA,2023-05-20,50,300.0

`

## File: portfolio_main.csv

`csv
銘柄コード,銘柄名,購入日,保有株数,購入単価
AJ312217,Smart-i ゴールドファンド(H有),2024-01-01,206223,14695.0
AJ311217,Smart-i ゴールドファンド(H無),2024-01-01,33911,32438.0
4731815C,たわらノーロード日経225,2024-01-01,139274,25130.0
0331418A,eMAXIS Slim全世界株式(オール・カントリー),2024-01-01,78138,25595.0
IONQ,IONQ,2025-10-17,5,69.2004
IONQ,IONQ,2025-11-20,6,49.12
IONQ,IONQ,2026-01-28,30,43.3533
QUBT,Quantum Computing,2025-10-17,15,20.4284
QUBT,Quantum Computing,2025-11-18,28,11.62
2432.T,DeNA,2025-05-19,20,2965.0
9434.T,ソフトバンク,2025-10-29,900,218.4
3922.T,PR TIMES,2025-11-10,3,2920.0
6036.T,KeePer技研,2025-12-29,28,3590.0
6653.T,正興電機製作所,2025-12-29,42,2385.0
9267.T,Genky DrugStores,2025-12-29,20,5060.0
5253.T,カバー,2026-01-09,100,1725.0

`

## File: portfolio_sub.csv

`csv
銘柄コード,銘柄名,購入日,保有株数,購入単価
6958.T,日本ＣＭＫ(株),2026-01-23,184.0,542.0
GOOGL,アルファベット,2026-01-23,2.0,327.9
9216.T,ビーウィズ,2026-01-01,61.0,1640.0
4392.T,FIG,2026-01-01,351.0,285.0
3150.T,グリムス,2026-01-01,41.0,2461.0
3924.T,ランドComp,2026-01-01,105.0,950.0
6544.T,Jエレベータ,2026-01-01,58.0,1728.5
6080.T,M&Aキャピタル,2026-01-06,29.0,3405.0
9556.T,INTLOOP,2026-01-06,27.0,3720.0
7199.T,プレミアG,2026-01-06,51.0,1960.0
9267.T,GenkyDrug,2026-01-06,20.0,4880.0
3901.T,マークラインズ,2026-01-06,66.0,1520.0
5574.T,ABEJA,2026-01-11,36.0,2800.0
2980.T,SRE HD,2026-01-11,30.0,3300.0
4384.T,ラクスル,2026-01-11,53.0,1884.0
6030.T,アドベンチャー,2026-01-11,58.0,1728.0
9219.T,ギックス,2026-01-11,103.0,973.0
5246.T,ELEMENTS,2026-01-16,139.0,717.0
3479.T,TKP,2026-01-16,50.0,1983.0
8117.T,中央自動車,2026-01-16,51.0,1973.0
3547.T,串カツ田中,2026-01-16,53.0,1901.0
3156.T,レスターHD,2026-01-16,35.0,2881.0
3923.T,ラクス,2026-01-21,101.0,985.4
6532.T,ベイカレント,2026-01-21,16.0,6246.0
9227.T,マイクロ波化学,2026-01-21,82.0,1224.0
4375.T,セーフィー,2026-01-26,112.0,890.0
2471.T,エスプール,2026-01-26,394.0,254.0
4436.T,ミンカブ,2026-01-26,221.0,453.0
5572.T,Ridge-i,2026-01-26,48.0,2086.0
9229.T,サンウェルズ,2026-01-26,276.0,362.0
4116.T,大日精化工業,2026-01-31,23.0,4285.0
6393.T,油研工業,2026-01-31,31.0,3235.0
4431.T,スマレジ,2026-01-31,37.0,2694.0
6315.T,TOWA,2026-01-31,35.0,2870.0
9211.T,エフ・コード,2026-01-31,59.0,1683.0
4418.T,JDSC,2026-02-05,91.0,1096.0
7047.T,ポート,2026-02-05,47.0,2135.0
6323.T,ローツェ,2026-02-05,31.0,3187.0
9219.T,ギックス,2026-02-05,106.0,941.0
9211.T,エフ・コード,2026-02-10,59.0,1684.0
2158.T,FRONTEO,2026-02-10,115.0,870.0
4395.T,アクリート,2026-02-10,83.0,1210.0
5244.T,jig.jp,2026-02-10,422.0,237.0
6393.T,油研工業,2026-02-10,30.0,3295.0
2981.T,ランディックス,2026-02-16,40.0,2492.0
9233.T,アジア航測,2026-02-16,80.0,1257.0
5288.T,アジアパイル,2026-02-16,64.0,1557.0
6036.T,KeePer技研,2026-02-16,29.0,3410.0
3093.T,トレジャーＦ,2026-02-16,58.0,1715.0
4382.T,ＨＥＲＯＺ,2026-02-15,125.0,802.0
6027.T,弁護士ドットコム,2026-02-15,41.0,2435.0
3993.T,ＰＫＳＨＡ,2026-02-15,35.0,2877.0
6361.T,荏原製作所,2026-02-15,19.0,5303.0
5032.T,ＡＮＹＣＯＬＯＲ,2026-02-15,24.0,4180.0
4373.T,シンプレクス・ホールディングス,2026-02-21,119.0,834.0
7818.T,トランザクション,2026-02-21,77.0,1295.0
8771.T,イー・ギャランティ,2026-02-21,57.5,1740.0

`

## File: portfolio_sub_.csv

`csv
銘柄コード,銘柄名,購入日,保有株数,購入単価
6958.T,日本ＣＭＫ(株),2026-01-23,178.0,561.0
GOOGL,アルファベット,2026-01-23,304.0,327.93
5595.T,QPS研究所,2026-02-11,57.0,1735.0
9216.T,ビーウィズ,2026-01-01,60.0,1640.0
4392.T,FIG,2026-01-01,259.0,385.0
3150.T,グリムス,2026-01-01,40.0,2450.0
3924.T,ランドComp,2026-01-01,99.0,1010.0
6544.T,Jエレベータ,2026-01-01,35.0,2850.0
6080.T,M&Aキャピタル,2026-01-06,29.0,3395.0
9556.T,INTLOOP,2026-01-06,32.0,3100.0
7199.T,プレミアG,2026-01-06,46.0,2150.0
9267.T,GenkyDrug,2026-01-06,20.0,4800.0
3901.T,マークラインズ,2026-01-06,34.0,2900.0
5574.T,ABEJA,2026-01-11,37.0,2698.0
2980.T,SRE HD,2026-01-11,31.0,3150.0
4384.T,ラクスル,2026-01-11,78.0,1280.0
6030.T,アドベンチャー,2026-01-11,25.0,3900.0
9219.T,ギックス,2026-01-11,102.0,980.0
5246.T,ELEMENTS,2026-01-16,140.0,713.0
3479.T,TKP,2026-01-16,42.0,2380.0
8117.T,中央自動車,2026-01-16,22.0,4500.0
3547.T,串カツ田中,2026-01-16,47.0,2100.0
3156.T,レスターHD,2026-01-16,25.0,3850.0
3923.T,ラクス,2026-01-21,101.0,982.0
6095.T,メドピア,2026-01-21,102.0,980.0
6532.T,ベイカレント,2026-01-21,20.0,4800.0
2150.T,ケアネット,2026-01-21,153.0,650.0
9227.T,マイクロ波化学,2026-01-21,80.0,1250.0
4375.T,セーフィー,2026-01-26,121.0,820.0
2471.T,エスプール,2026-01-26,253.0,395.0
4436.T,ミンカブ,2026-01-26,86.0,1150.0
5572.T,Ridge-i,2026-01-26,54.0,1850.0
9229.T,サンウェルズ,2026-01-26,40.0,2450.0
4116.T,大日精化工業,2026-01-31,23.0,4345.0
6393.T,油研工業,2026-01-31,37.0,2680.0
4431.T,スマレジ,2026-01-31,35.0,2850.0
6315.T,TOWA,2026-01-31,10.0,9200.0
9211.T,エフ・コード,2026-01-31,68.0,1450.0
5595.T,ジェイフロンティア,2026-02-05,28.0,3450.0
4418.T,JDSC,2026-02-05,102.0,980.0
7047.T,ポート,2026-02-05,46.0,2150.0
6323.T,ローツェ,2026-02-05,29.0,3415.0
9219.T,ギックス,2026-02-05,95.0,1050.0
9211.T,エフ・コード,2026-02-10,63.0,1580.0
2158.T,FRONTEO,2026-02-10,89.0,1120.0
4395.T,アクリート,2026-02-10,68.0,1450.0
5244.T,jig.jp,2026-02-10,172.0,580.0
6393.T,油研工業,2026-02-10,35.0,2820.0

`

## File: README.md

# 株式管理ダッシュボード

日本株、米国株、投資信託を一元管理できるStreamlitアプリケーションです。資産の評価額、損益状況、ポートフォリオの構成比（ヒートマップ）などを直感的に把握できます。

## 特徴
*   **マルチポートフォリオ**: 「保有株式」と「仮想保有株式」の2つを管理可能。
*   **自動データ取得**: 株価は `yfinance`、投資信託はYahoo!ファイナンスから自動取得。
*   **可視化**: Plotlyによる資産ヒートマップ、Matplotlibによる個別銘柄のチャート表示。
*   **キャッシュ機能**: 投資信託データのキャッシュにより、読み込み速度を最適化。
*   **一括取込**: 手動リストからの株価自動取得・取込ツールを追加。

## セットアップ

### 1. 前提条件
*   Python 3.8以上
*   インターネット接続 (株価データの取得に必要)

### 2. インストール
リポジトリをクローンまたはダウンロードし、必要なライブラリをインストールします。

```bash
cd kabu
pip install -r requirements.txt
```

## 使い方

### アプリケーションの起動
以下のコマンドでStreamlitアプリを起動します。

```bash
streamlit run stock_app.py
```

ブラウザが立ち上がり、ダッシュボードが表示されます (通常は `http://localhost:8501`)。

### ポートフォリオの登録
1.  **ポートフォリオ選択**: サイドバー上部のラジオボタンで「保有株式」または「仮想保有株式」を選択します。
2.  **データの入力**: メイン画面のテーブルにお持ちの銘柄情報を入力します。
    *   **コード**:
        *   日本株: `7203.T` (トヨタ自動車) のように `.T` を付けます。
        *   米国株: `AAPL` (Apple), `MSFT` (Microsoft) などのティッカーシンボル。
        *   投資信託: Yahoo!ファイナンスのファンドコード (例: `01314184` ... ｅＭＡＸＩＳ Ｓｌｉｍ 米国株式（Ｓ＆Ｐ５００）)。
    *   **購入単価**: 平均取得単価 (円またはドル)。投資信託は1万口あたりの単価。
    *   **購入日**: `YYYY-MM-DD` 形式。
    *   **保有株数**: 株数 (投資信託の場合は口数)。

データは自動的に `portfolio_main.csv` または `portfolio_sub.csv` に保存されます。

### 手動リストからの取り込み（仮想ポートフォリオ）
手動で作成したリストを読み込み、指定日の株価を自動取得して `portfolio_sub.csv` に追記できます。

1.  `import_data.txt` に以下の形式（タブ区切り推奨）でデータを貼り付けます。
    ```text
    No.	分析日	銘柄コード	銘柄名	...
    1	2026/01/01	9216	ビーウィズ	...
    ```
    ※分析日が休場日の場合、自動的に直近の営業日の終値を取得します。

2.  以下のコマンドを実行します。
    ```bash
    python import_stock_data.py
    ```

## ファイル構成
*   `stock_app.py`: アプリケーション本体
*   `import_stock_data.py`: 手動リスト取り込みツール
*   `import_data.txt`: 取り込み用データファイル
*   `stock_research_agent.py`: (Experimental) AIによる銘柄リサーチツール
*   `specification.md`: 詳細仕様書
*   `stock_data_cache/`: 取得した投資信託データのキャッシュ

## 注意事項
*   投資信託のデータはスクレイピングで取得しているため、対象サイトの仕様変更により取得できなくなる場合があります。
*   サイドバーの「キャッシュを削除して再取得」ボタンで、キャッシュをクリアして最新データを強制取得できます。


## File: requirements.txt

`txt
streamlit
yfinance
pandas
matplotlib
plotly
requests
beautifulsoup4
lxml
`

## File: specification.md

# 株式管理ダッシュボード 仕様書

## 1. 概要
本アプリケーションは、日本株、米国株、および日本の投資信託を一元管理するためのStreamlit製ダッシュボードです。保有銘柄の評価額、損益、および価格推移を可視化し、資産状況を把握することを目的としています。

## 2. システム要件
*   **OS**: Windows, macOS, Linux (Pythonが動作する環境)
*   **言語**: Python 3.x
*   **主要ライブラリ**:
    *   `streamlit`: Webアプリケーションフレームワーク
    *   `yfinance`: 株価データ取得
    *   `pandas`: データ操作
    *   `matplotlib`: チャート描画
    *   `plotly`: インタラクティブなグラフ描画 (ツリーマップ)
    *   `requests`, `beautifulsoup4`: スクレイピング (投資信託データ)

## 3. 機能一覧

### 3.1. ポートフォリオ管理機能
*   **複数ポートフォリオ対応**:
    *   「保有株式」(Main) と「仮想保有株式」(Sub) の2つのポートフォリオを切り替え可能。
*   **データ編集**:
    *   ブラウザ上で直接ポートフォリオデータの追加・編集・削除が可能。
    *   入力項目: 銘柄コード, 銘柄名, 購入日, 保有株数 (または口数), 購入単価。
*   **データ永続化**:
    *   入力データはCSVファイル (`portfolio_main.csv`, `portfolio_sub.csv`) として保存。

### 3.2. データ取得機能
*   **自動判別**:
    *   銘柄コードから資産タイプを自動判別 (日本株: `xxxx.T`, 米国株: アルファベット, 投資信託: その他)。
*   **株価取得**:
    *   日本株・米国株: `yfinance` APIを使用。
    *   投資信託: Yahoo!ファイナンスから基準価額履歴をスクレイピング。
*   **為替レート**:
    *   USD/JPYレートを自動取得し、米国株の評価額を円換算して表示。
*   **キャッシュ機能**:
    *   投資信託のデータは `stock_data_cache/` ディレクトリにCSVとしてキャッシュし、スクレイピング負荷を軽減。
    *   サイドバーからキャッシュの削除・再取得が可能。

### 3.3. 可視化・分析機能
*   **資産サマリー**:
    *   ポートフォリオ全体の評価額、含み損益、損益率をサイドバーに表示。
*   **ヒートマップ**:
    *   Plotly Treemapを使用し、保有銘柄の評価額規模と騰落率 (前日比/トータル損益率) を視覚化。
*   **個別銘柄カード**:
    *   現在値、前日比/前週比、評価額、含み損益を表示。
    *   バッジ機能による直感的な騰落表示 (上昇: 緑, 下落: 赤)。
    *   Matplotlibによる価格推移チャート (取得単価ライン、購入ポイントのプロット付き)。

## 4. ファイル構成
```text
kabu/
├── stock_app.py          # メインアプリケーションコード
├── requirements.txt      # 依存ライブラリ一覧
├── Dockerfile            # コンテナ化設定 (任意)
├── portfolio_main.csv    # 保有株式データ (自動生成/更新)
├── portfolio_sub.csv     # 仮想保有株式データ (自動生成/更新)
└── stock_data_cache/     # 投資信託データキャッシュ (自動生成)
```

## 5. 外部依存サービス
*   **Yahoo! Finance (US)**: `yfinance` 経由でのデータ取得。
*   **Yahoo!ファイナンス (日本)**: 投資信託データのスクレイピング先。

## 6. 注意事項
*   投資信託のデータ取得はスクレイピングを行っているため、対象サイトの構造変更により動作しなくなる可能性があります。
*   スクレイピングには待機時間を設け、サーバーへの負荷を考慮した実装となっています (`scrape_japan_fund_history_params`)。


## File: stock_app.py

`python
import streamlit as st
import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import plotly.express as px
from datetime import datetime, timedelta
import os
import math
import requests
from bs4 import BeautifulSoup
import re
import time
import shutil
import random
from urllib.parse import urljoin

# --- ページ設定 ---
st.set_page_config(page_title="株式管理ダッシュボード", layout="wide")

# --- カスタムCSS ---
st.markdown("""
    <style>
    .block-container { padding-top: 1rem; padding-bottom: 5rem; }
    @media (min-width: 768px) { section[data-testid="stSidebar"] { width: 340px !important; } }
    h3 { scroll-margin-top: 4rem; }
    .diff-green { color: #008000; font-weight: bold; font-size: 0.95em; }
    .diff-red { color: #d0021b; font-weight: bold; font-size: 0.95em; }
    .price-large { font-weight: bold; margin-bottom: 0.2rem; line-height: 1.2; font-size: 2.0em; }
    @media (max-width: 600px) { .price-large { font-size: 1.6em; } .info-row { font-size: 0.9em; } h1 { font-size: 1.5em; } }
    .label-text { font-size: 0.9em; color: #666; margin-right: 8px; }
    .info-row { margin-bottom: 5px; font-size: 1.05em; display: flex; align-items: center; }
    div[role="radiogroup"] { margin-bottom: 0px !important; margin-top: -15px !important; }
    .streamlit-expanderContent { padding-top: 0px !important; }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 0. ユーティリティ
# ==========================================
def get_ticker_type(ticker):
    t = str(ticker).strip().upper()
    if t.endswith(".T"): return "JP_STOCK"
    if t.isalpha(): return "US_STOCK"
    return "JP_FUND"

def safe_float(value, default=0.0):
    try:
        if value is None: return default
        if isinstance(value, (int, float)):
            if math.isnan(value): return default
            return float(value)
        s = str(value).replace(',', '').replace('%', '').replace('円', '').strip()
        if not s or s in ['-', '---', 'N/A']: return default
        return float(s)
    except: return default

def safe_fmt(value, fmt=",.0f", symbol=""):
    val = safe_float(value)
    try: return f"{symbol}{val:{fmt}}"
    except: return f"{symbol}0"

def create_badge(val, pct, symbol="¥"):
    val = safe_float(val); pct = safe_float(pct)
    css = "diff-green" if val>=0 else "diff-red"
    icon = "▲" if val>=0 else "▼"
    return f'<span class="{css}">{icon} {symbol}{abs(val):,.0f} ({"+" if val>=0 else ""}{pct:.2f}%)</span>'

def create_badge_f(val, pct, symbol="$"):
    val = safe_float(val); pct = safe_float(pct)
    css = "diff-green" if val>=0 else "diff-red"
    icon = "▲" if val>=0 else "▼"
    return f'<span class="{css}">{icon} {symbol}{abs(val):,.2f} ({"+" if val>=0 else ""}{pct:.2f}%)</span>'

# ==========================================
# 1. データ取得ロジック
# ==========================================
CACHE_DIR = "stock_data_cache"
if not os.path.exists(CACHE_DIR): os.makedirs(CACHE_DIR)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
}

@st.cache_data(ttl=3600)
def get_usdjpy_rate():
    try:
        ticker = yf.Ticker("USDJPY=X")
        hist = ticker.history(period="1d")
        if not hist.empty: return safe_float(hist['Close'].iloc[-1], 150.0)
    except: pass
    return 150.0

usdjpy_rate = get_usdjpy_rate()

import json

def scrape_japan_fund_history_params(code, status_area):
    """
    YahooファイナンスのHTML内に埋め込まれたJSON(window.__PRELOADED_STATE__)から
    mainYJChart -> chart -> chartLine を抽出して株価データを取得する。
    これにより、HTMLテーブルでは1ヶ月分しか取れない制限を回避し、2年分(週次/日次)を取得する。
    """
    base_url = f"https://finance.yahoo.co.jp/quote/{code}/chart"
    
    session = requests.Session()
    session.headers.update(HEADERS)
    
    if status_area:
        status_area.text(f"Fetching {code} (JSON method)...")

    # Attempt 1: Direct HTML Table Parsing (Most reliable for some funds like AJ311217)
    # This requires fetching /history page, not /chart
    history_url = f"https://finance.yahoo.co.jp/quote/{code}/history"
    try:
        # print(f"Trying HTML table parse for {code}...")
        res_h = session.get(history_url, timeout=10)
        if res_h.status_code == 200:
            soup_h = BeautifulSoup(res_h.text, 'html.parser')
            tables = soup_h.find_all('table')
            
            for table in tables:
                full_text = table.get_text()
                if "日付" in full_text and "基準価額" in full_text:
                    rows = []
                    trs = table.find_all('tr')
                    header = []
                    for tr in trs:
                        ths = tr.find_all('th')
                        if ths:
                            header = [th.get_text().strip() for th in ths]
                            continue
                        tds = tr.find_all('td')
                        if tds:
                            row = [td.get_text().strip() for td in tds]
                            if len(row) == len(header):
                                rows.append(row)
                    
                    if header and rows:
                        df_table = pd.DataFrame(rows, columns=header)
                        col_date = next((c for c in df_table.columns if "日付" in c), None)
                        col_price = next((c for c in df_table.columns if "基準価額" in c), None)
                        
                        if col_date and col_price:
                            df_curr = df_table[[col_date, col_price]].copy()
                            df_curr.columns = ["Date", "Close"]
                            
                            def parse_jp_date(s):
                                try: return pd.to_datetime(s, format='%Y年%m月%d日')
                                except: return pd.to_datetime(s, errors='coerce')
                            
                            df_curr['Date'] = df_curr['Date'].apply(parse_jp_date)
                            df_curr['Close'] = df_curr['Close'].apply(safe_float)
                            df_curr = df_curr.dropna().set_index('Date').sort_index()
                            
                            if not df_curr.empty:
                                print(f"Success: Parsed HTML table with {len(df_curr)} rows.")
                                # Return immediately if successful
                                if len(df_curr) > 30:
                                   return df_curr.resample('W-FRI').last().dropna()[['Close']]
                                else:
                                   return df_curr[['Close']]
    except Exception as e:
        print(f"HTML Table Parse Error: {e}")

    # Attempt 2: JSON Extraction (Fallback/Advanced)
    try:
        res = session.get(base_url, timeout=10)
        if res.status_code != 200:
            print(f"Failed to fetch {base_url}: {res.status_code}")
            return pd.DataFrame()

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
            return pd.DataFrame()
            
        # データ抽出: mainYJChart -> chart -> chartLine -> [0] -> data
        # MEMO: chartLineはリスト担っていることが多い
        chart_data = None
        
        # 深い階層を安全に探す
        try:
            if 'mainYJChart' in target_json:
                c = target_json['mainYJChart']['chart']
                if 'chartLine' in c:
                    lines = c['chartLine']
                    if isinstance(lines, list) and len(lines) > 0:
                        chart_data = lines[0].get('data', [])
        except Exception as e:
            print(f"Data hierarchy traversal error: {e}")
            
        if not chart_data:
            # Fallback to mainFundHistory (approx 1 month data)
            # print("No chart data in mainYJChart, checking mainFundHistory...")
            try:
                if 'mainFundHistory' in target_json:
                    hist = target_json['mainFundHistory']
                    if 'histories' in hist:
                        # Extract from histories
                        # Format: {'date': '2026年2月6日', 'price': '20,696', ...}
                        raw_data = hist['histories']
                        if isinstance(raw_data, list) and len(raw_data) > 0:
                            chart_data = []
                            for item in raw_data:
                                if 'date' in item and 'price' in item:
                                    # Normalize date
                                    d_str = item['date'] # "2026年2月6日"
                                    # We can handle date parsing later or here
                                    # Cleaning price
                                    p_str = item['price'].replace(',', '')
                                    chart_data.append({"date": d_str, "price": p_str})
                            print(f"Fallback: Found {len(chart_data)} data points in mainFundHistory")
            except Exception as e:
                print(f"Fallback error: {e}")

        if not chart_data:
            # Fallback 2: mainFundPriceBoard (Current Price Only)
            # Helps to at least show the current valuation even if chart is empty
            try:
                if 'mainFundPriceBoard' in target_json:
                    pb = target_json['mainFundPriceBoard']
                    if 'fundPrices' in pb:
                         fp = pb['fundPrices']
                         if 'price' in fp and 'updateDate' in fp:
                             p_str = fp['price'].replace(',', '')
                             d_str = fp['updateDate'] # format "12/05"
                             
                             # Estimate year
                             now = datetime.now()
                             try:
                                 # Parse MM/DD
                                 dt_part = datetime.strptime(d_str, '%m/%d')
                                 # Assign current year first
                                 dt = dt_part.replace(year=now.year)
                                 # If date is in future (e.g. data says 12/31 but today is 1/1), sub 1 year?
                                 # But updateDate is usually past.
                                 # Use simple logic: valid date.
                                 
                                 chart_data = [{"date": dt, "price": p_str}]
                                 print(f"Fallback 2: Found current price in mainFundPriceBoard: {p_str} ({d_str})")
                             except: pass
            except Exception as e:
                print(f"Fallback 2 error: {e}")

        if not chart_data:
            print("No chart data found in JSON (mainYJChart, mainFundHistory, or mainFundPriceBoard).")
            return pd.DataFrame()
            
        print(f"Found {len(chart_data)} data points for {code}")
        
        # DataFrame化
        rows = []
        for d in chart_data:
            date_val = d.get('date') or d.get('Date')
            price = d.get('price') or d.get('Close') or d.get('close') or d.get('value')
            
            if date_val is not None and price is not None:
                rows.append({"Date": date_val, "Close": price})
                
        if not rows:
            return pd.DataFrame()
            
        df = pd.DataFrame(rows)
        
        # Date parsing handling
        # If fallback 2 used, date is already datetime
        if not pd.api.types.is_datetime64_any_dtype(df['Date']):
             # Try multiple formats
            def parse_jp_date(s):
                 if isinstance(s, datetime): return s
                 # "2026年2月6日" -> datetime
                 try:
                     return pd.to_datetime(s, format='%Y年%m月%d日')
                 except:
                     try:
                         return pd.to_datetime(s) # Standard fallback
                     except: return pd.NaT

            if df['Date'].astype(str).str.contains('年').any():
                 df['Date'] = df['Date'].apply(parse_jp_date)
            else:
                 df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        
        df['Close'] = df['Close'].apply(safe_float)
        
        df = df.dropna(subset=['Date'])
        df = df.set_index('Date').sort_index()
        
        # 週次に間引く
        if len(df) > 30:
            df_weekly = df.resample('W-FRI').last().dropna()
            return df_weekly[['Close']]
        else:
            return df[['Close']]



    except Exception as e:
        print(f"Top level scrape error: {e}")
        return pd.DataFrame()

def get_history_smart(ticker, data_type, status_placeholder=None):
    # A. 個別株
    if data_type != "JP_FUND":
        if status_placeholder:
            status_placeholder.text(f"⏳ {ticker} (株) 取得中...")
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period="2y")
            if not df.empty:
                if df.index.tz is not None:
                    df.index = df.index.tz_localize(None)
                return df[['Close']]
        except: pass
        return pd.DataFrame()

    # B. 投資信託
    safe_ticker = "".join(c for c in ticker if c.isalnum())
    file_path = os.path.join(CACHE_DIR, f"{safe_ticker}.csv")
    
    # キャッシュチェック
    if os.path.exists(file_path):
        try:
            df = pd.read_csv(file_path, index_col=0, parse_dates=True)
            mtime = datetime.fromtimestamp(os.path.getmtime(file_path)).date()
            if len(df) > 0 and mtime == datetime.now().date():
                return df
        except: pass

    # 新規取得
    df = scrape_japan_fund_history_params(ticker, status_placeholder)
    
    # 保存
    if not df.empty:
        try: df[['Close']].to_csv(file_path)
        except: pass
    
    return df

@st.cache_data(ttl=3600*24)
def get_fund_name(code):
    url = f"https://finance.yahoo.co.jp/quote/{code}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')
        t_tag = soup.find('title')
        if t_tag:
            return t_tag.text.split('【')[0].split(' - ')[0]
    except: pass
    return code

# ==========================================
# 2. メイン処理 & UI
# ==========================================
PORTFOLIOS = {
    "保有株式": "portfolio_main.csv",
    "仮想保有株式": "portfolio_sub.csv"
}

# Sidebar Title Removed per user request

# キャッシュクリアを画面右上に配置（テキストリンク風スタイル適用）
st.markdown("""
<style>
div.stButton > button:first-child {
    background-color: transparent;
    border: none;
    color: #888;
    text-decoration: underline;
    padding: 0;
}
div.stButton > button:first-child:hover {
    color: #fff;
    text-decoration: none;
    background-color: transparent;
    border: none;
}
</style>
""", unsafe_allow_html=True)

# 資産状況を表示するプレースホルダーを最上部に作成
metric_placeholder = st.sidebar.empty()
st.sidebar.markdown("---")

c1, c2 = st.columns([9, 1])
with c2:
    if st.button("cache clear", key="cache_clear_top"):
        if os.path.exists(CACHE_DIR):
            try:
                shutil.rmtree(CACHE_DIR)
                os.makedirs(CACHE_DIR)
                st.cache_data.clear()
                st.success("Cleared")
                time.sleep(0.5)
                st.rerun()
            except: pass

selected_pf_name = st.radio(
    "ポートフォリオ選択", list(PORTFOLIOS.keys()),
    horizontal=True, label_visibility="collapsed"
)
current_csv_file = PORTFOLIOS[selected_pf_name]

# Header removed per user request

if os.path.exists(current_csv_file):
    try:
        df = pd.read_csv(current_csv_file)
        for c in ["銘柄コード", "銘柄名", "購入日", "保有株数", "購入単価"]:
            if c not in df.columns: df[c] = ""
        df["購入日"] = pd.to_datetime(df["購入日"], errors='coerce').dt.date
    except: df = pd.DataFrame()
else:
    df = pd.DataFrame(columns=["銘柄コード", "銘柄名", "購入日", "保有株数", "購入単価"])

# Hint caption removed per user request

# ★修正: スライダーで高さを調整 (Expanderに収納)★
val_init = 150
height_key = f"editor_height_{selected_pf_name}"
if height_key in st.session_state:
    val_init = st.session_state[height_key]

with st.expander("📏 表の高さ調整", expanded=False):
    table_height = st.slider("高さ(px)", 100, 1000, val_init, 50, key=height_key)

edited_df = st.data_editor(
    df, num_rows="dynamic",
    height=table_height,
    column_config={
        "銘柄コード": st.column_config.TextColumn("コード"),
        "購入単価": st.column_config.NumberColumn("購入単価"),
        "購入日": st.column_config.DateColumn("購入日", format="YYYY-MM-DD"),
    },
    key=f"editor_{selected_pf_name}"
)

try:
    df_save = edited_df.dropna(subset=["銘柄コード"])
    if not df_save.empty or not df.empty: df_save.to_csv(current_csv_file, index=False)
except: pass

st.divider()

# ==========================================
# 3. 集計・分析
# ==========================================
analyzed_data = []
total_val = 0; total_inv = 0

if not edited_df.empty:
    valid_rows = edited_df.dropna(subset=["銘柄コード"])
    if not valid_rows.empty:
        
        status_text = st.empty()
        pf_map = {}
        
        for i, (idx, row) in enumerate(valid_rows.iterrows()):
            ticker = str(row["銘柄コード"]).strip()
            if not ticker or ticker=="nan": continue
            
            if ticker not in pf_map:
                data_type = get_ticker_type(ticker)
                is_us = (data_type == "US_STOCK")
                is_fund = (data_type == "JP_FUND")
                
                name = row["銘柄名"]
                price = 0.0
                prev = 0.0
                
                hist_df = get_history_smart(ticker, data_type, status_text)
                
                if not hist_df.empty:
                    price = safe_float(hist_df['Close'].iloc[-1])
                    if len(hist_df) >= 2:
                        prev = safe_float(hist_df['Close'].iloc[-2])
                
                if is_fund and (pd.isna(name) or not name or name == ticker):
                    name = get_fund_name(ticker)
                if pd.isna(name) or not name: name = ticker

                pf_map[ticker] = {
                    "type": data_type, "name": name, "is_us": is_us,
                    "hist": hist_df, "price": price, "prev": prev, "tx": []
                }

            if ticker in pf_map:
                try:
                    s = safe_float(row["保有株数"])
                    p = safe_float(row["購入単価"])
                    d_raw = row["購入日"]
                    d = pd.to_datetime(d_raw).date() if pd.notna(d_raw) else datetime.now().date()
                    pf_map[ticker]["tx"].append({"shares":s, "price":p, "date":d})
                except: continue
        
        status_text.empty()

        # --- 集計 ---
        for ticker, d in pf_map.items():
            tx = d["tx"]
            if not tx: continue 
            
            total_shares = sum(t["shares"] for t in tx)
            cost_sum = sum(t["shares"]*t["price"] for t in tx)
            avg_price = (cost_sum/total_shares) if total_shares>0 else 0
            
            curr_price = d["price"]
            hist = d["hist"]['Close'] if not d["hist"].empty else pd.Series(dtype=float)
            
            day_chg=0; day_pct=0; week_chg=0; week_pct=0
            
            # 変動計算
            if curr_price > 0 and d["prev"] > 0:
                day_chg = curr_price - d["prev"]
                day_pct = (day_chg / d["prev"] * 100)
            
            if not hist.empty and len(hist)>=2:
                idx = -2 if d["type"] == "JP_FUND" else (-6 if len(hist)>=6 else 0)
                if len(hist) >= abs(idx):
                    w = safe_float(hist.iloc[idx])
                    if w > 0:
                        week_chg = curr_price - w
                        week_pct = (week_chg/w*100)

            is_us = d["is_us"]
            cur_sym = "$" if is_us else "¥"
            
            if is_us:
                val_jpy = (curr_price * usdjpy_rate) * total_shares
                inv_jpy = cost_sum * usdjpy_rate
            else:
                if d["type"] == "JP_FUND":
                    val_jpy = (curr_price / 10000) * total_shares
                    inv_jpy = (cost_sum / 10000)
                else:
                    val_jpy = curr_price * total_shares
                    inv_jpy = cost_sum

            diff_jpy = val_jpy - inv_jpy
            diff_pct = (diff_jpy/inv_jpy*100) if inv_jpy>0 else 0.0
            
            total_val += val_jpy; total_inv += inv_jpy
            
            if is_us:
                html_day = create_badge_f(day_chg, day_pct)
                html_week = create_badge_f(week_chg, week_pct)
            else:
                html_day = create_badge(day_chg, day_pct)
                html_week = create_badge(week_chg, week_pct)
            html_pl = create_badge(diff_jpy, diff_pct)

            analyzed_data.append({
                "ticker": ticker, "name": d["name"], "type": d["type"],
                "safe_id": "".join(c for c in ticker if c.isalnum()),
                "hist": hist, "cur_sym": cur_sym, 
                "disp_price": curr_price, "disp_avg": avg_price,
                "html_day": html_day, "html_week": html_week, "html_pl": html_pl,
                "shares": total_shares, "tx": tx,
                "val_jpy": val_jpy, "diff_pct": diff_pct, "day_pct": day_pct,
                "hm_label": f"{d['name']}<br>({ticker})"
            })

# ==========================================
# 4. 表示
# ==========================================
# Removed duplicate header and divider
# st.sidebar.divider(); st.sidebar.subheader("📌 保有銘柄")
if total_inv > 0:
    diff = total_val - total_inv
    pct = (diff/total_inv*100)
    # 最上部のプレースホルダーに表示
    metric_placeholder.metric("💰 ポートフォリオ評価額", safe_fmt(total_val, symbol="¥"), f"{diff:,.0f} ({pct:+.2f}%)")

st.sidebar.subheader("📌 保有銘柄")
for item in analyzed_data:
    icon = "🟢" if item['diff_pct']>=0 else "🔴"
    st.sidebar.markdown(f"[{icon} {item['name']} <span style='color:gray'>({item['diff_pct']:.1f}%)</span>](#{item['safe_id']})", unsafe_allow_html=True)

if analyzed_data:
    with st.expander("📊 ポートフォリオ・ヒートマップ", expanded=True):
        mode = st.radio("hm_mode", ["トータル損益率", "前日比(投信は前週)"], horizontal=True, label_visibility="collapsed")
        df_viz = pd.DataFrame(analyzed_data)
        df_viz['diff_pct'] = df_viz['diff_pct'].fillna(0)
        df_viz['day_pct'] = df_viz['day_pct'].fillna(0)
        df_viz['val_jpy'] = df_viz['val_jpy'].fillna(0)
        df_viz = df_viz[df_viz['val_jpy'] > 0]
        
        if not df_viz.empty:
            col = 'diff_pct' if "トータル" in mode else 'day_pct'
            fig = px.treemap(
                df_viz, path=['hm_label'], values='val_jpy', color=col,
                custom_data=[col], color_continuous_scale=['red', 'white', 'green'], color_continuous_midpoint=0
            )
            fig.update_layout(margin=dict(t=10, l=0, r=0, b=0), height=300)
            fig.update_traces(texttemplate="%{label}<br>%{customdata[0]:.2f}%", hovertemplate="<b>%{label}</b><br>評価額: ¥%{value:,.0f}<br>%{customdata[0]:.2f}%")
            st.plotly_chart(fig, use_container_width=True)
    
    st.divider()

    # --- Grid Display (2 Columns) ---
    def chunked(iterable, n):
        return [iterable[i:i + n] for i in range(0, len(iterable), n)]

    for row_items in chunked(analyzed_data, 2):
        cols = st.columns(2)
        for item, col in zip(row_items, cols):
            with col:
                with st.container(border=True): # Card Style
                    # 1. Header (Dynamic Sizing for Alignment)
                    name = item['name']
                    # タイトルが長い場合はフォントサイズを小さくし、高さを固定してズレを防ぐ
                    title_style = "font-size:1.1em; line-height:1.4;" if len(name) > 15 else "font-size:1.4em; line-height:1.2;"

                    # Define price strings BEFORE usage in st.markdown
                    if item['cur_sym'] == '$':
                        price_str = safe_fmt(item['disp_price'], ",.2f", "$")
                        avg_str = safe_fmt(item['disp_avg'], ",.2f", "$")
                    else:
                        price_str = safe_fmt(item['disp_price'], ",.0f", "¥")
                        avg_str = safe_fmt(item['disp_avg'], ",.0f", "¥")

                    if item['type'] == 'JP_FUND':
                        lbl_primary = "前週比"
                        show_secondary = False
                    else:
                        lbl_primary = "前日比"
                        lbl_secondary = "前週比"
                        show_secondary = True
                    
                    metrics_html = f'<span><span style="color:#aaa;">{lbl_primary}:</span> {item["html_day"]}</span>'
                    if show_secondary:
                        metrics_html += f'<span><span style="color:#aaa;">{lbl_secondary}:</span> {item["html_week"]}</span>'

                    st.markdown(f"""
                    <div style="margin-bottom:0px; line-height:1.2;">
                        <a href='#{item['safe_id']}' style="text-decoration:none; color:inherit; font-weight:bold; {title_style}">{name}</a>
                        <span style="font-size:0.75em; color:#aaa; margin-left:6px; font-weight:normal;">{item['ticker']}</span>
                    </div>

                    <div style="margin-bottom:10px; display:flex; align-items:baseline; flex-wrap:wrap; column-gap:12px;">
                        <div style="font-size:1.4em; font-weight:bold; color:#fff;">
                            {price_str}
                        </div>
                        <div style="font-size:0.85em; display:flex; gap:8px;">
                            {metrics_html}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                    # 3. Holdings Info Box (Dark Mode Background)
                    unit = "口" if item['type']=='JP_FUND' else "株"
                    val_str = safe_fmt(item['val_jpy'], ",.0f", "¥")
                    
                    st.markdown(f"""
                    <div style="background-color:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:15px; font-size:0.9em;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="color:#bbb;">保有数量</span>
                            <span style="font-weight:500; color:#eee;">{item['shares']:,.0f} {unit}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="color:#bbb;">取得単価</span>
                            <span style="font-weight:500; color:#eee;">{avg_str}</span>
                        </div>
                        <div style="border-top:1px solid rgba(255,255,255,0.1); margin:4px 0;"></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#bbb;">評価額</span>
                            <div>
                                <span style="font-weight:bold; font-size:1.1em; color:#fff;">{val_str}</span>
                                <span style="margin-left:5px;">{item['html_pl']}</span>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    with st.expander("詳細履歴", expanded=False):
                        for t in item['tx']:
                            st.caption(f"{t['date']}: {t['shares']:,.0f}{unit} @ {item['cur_sym']}{t['price']:,.0f}")

                    # 4. Chart (Dark Theme)
                    hist = item['hist']
                    if not hist.empty:
                        # Use dark_background context
                        with plt.style.context('dark_background'):
                            fig, ax = plt.subplots(figsize=(6, 3))
                            
                            # Background transparent/match streamlits dark
                            bg_color = '#0e1117'
                            fig.patch.set_facecolor(bg_color)
                            ax.set_facecolor(bg_color)
                            
                            if len(hist) == 1:
                                ax.plot(hist.index, hist, color='#dddddd', marker='o', linestyle='None', label='Price')
                            else:
                                ax.plot(hist.index, hist, color='#dddddd', lw=1.2, label='Price')
                            
                            ax.axhline(y=item['disp_avg'], color='red', ls='--', alpha=0.6, label='Avg')
                            
                            total_days = (hist.index[-1] - hist.index[0]).days
                            if total_days < 90:
                                ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
                                if total_days == 0:
                                    ax.set_xlim(hist.index[0] - timedelta(days=1), hist.index[0] + timedelta(days=1))
                            else:
                                ax.xaxis.set_major_formatter(mdates.DateFormatter('%y/%m'))
                            
                            # Plot Buy Points
                            for t in item['tx']:
                                bd = pd.Timestamp(t['date'])
                                if bd >= hist.index[0] and bd <= hist.index[-1]:
                                    ax.scatter([bd], [t['price']], color='#ff4b4b', s=30, zorder=5, alpha=0.9)
                            
                            ax.legend(fontsize=7, loc='upper left', frameon=False, labelcolor='white')
                            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f"{item['cur_sym']}{x:,.0f}"))
                            ax.grid(True, ls=':', alpha=0.2, color='white')
                            ax.tick_params(labelsize=8, colors='white')
                            for spine in ax.spines.values():
                                spine.set_edgecolor('#444')

                            st.pyplot(fig, use_container_width=True)
                    else:
                        st.info("チャートデータなし")
`

## File: stock_research_agent.py

`python
import os
import yfinance as yf
import pandas as pd
import google.generativeai as genai
from datetime import datetime

# --- Configuration ---
# You need to set your Gemini API Key here or in environment variables
GEMINI_API_KEY = "AIzaSyAjUet8Osta6J50Fm_9eOuHMsUSu0lrcHU" 
# If not in env, prompted to input (or hardcode for testing if safe)

TARGET_CRITERIA = {
    "market_cap_min": 10_000_000_000,  # 100億円
    "market_cap_max": 200_000_000_000, # 1000億円 (increased slightly to catch near-misses)
    "per_max": 20.0,
    "revenue_growth_min": 0.10,        # 10%
    "equity_ratio_min": 0.40           # 40%
}

# --- Prompt for Gemini ---
RESEARCH_PROMPT = """
あなたはプロの「日本株エクイティアナリスト」兼「フォレンジック会計士」です。
以下の投資基準を持つ日本の「割安成長株」を15銘柄ピックアップしてください。
出力は純粋なJSON形式のリスト（コードのみ、またはコードと銘柄名のリスト）で返してください。余計なマークダウンや説明は不要です。

## ターゲット投資家像
- **投資スタイル**: 中長期（2〜3年）で株価2倍〜3倍（ダブルバガー以上）を狙う。
- **好む銘柄**: 中小型の割安成長株（GARP）。特に市場に見過ごされている「利益の質が高い」企業。

## スクリーニング基準（定量的条件）
1. **時価総額**: 100億円〜1000億円程度
2. **割安性**: PER 20倍以下（PEGレシオ1倍以下なら20倍超も可）
3. **成長性**: 売上高成長率 10%以上
4. **財務**: 自己資本比率 40%以上（SaaS等は例外可）

## 出力フォーマット
[
  {"code": "9999.T", "name": "銘柄名", "reason": "簡単な選定理由"},
  ...
]
"""

def get_candidates_from_gemini():
    """Gemini APIを使って候補銘柄のリストを取得する"""
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY is not set.")
        return []

    print("Gemini is researching candidate stocks...")
    
    # List of models to try in order
    models_to_try = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite-001'
    ]
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    import time
    import re

    for model_name in models_to_try:
        print(f"Trying model: {model_name}...")
        retries = 1
        for attempt in range(retries + 1):
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(RESEARCH_PROMPT)
                
                text = response.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0]
                    
                import json
                candidates = json.loads(text)
                print(f"Gemini found {len(candidates)} candidates using {model_name}.")
                return candidates
                
            except Exception as e:
                e_str = str(e)
                if "429" in e_str or "Quota exceeded" in e_str:
                    print(f"Rate limit hit for {model_name}. Waiting to retry...")
                    # Try to parse retry time
                    wait_time = 30 # default
                    match = re.search(r"retry in (\d+\.?\d*)s", e_str)
                    if match:
                        wait_time = float(match.group(1)) + 5 # Add buffer
                    
                    if attempt < retries:
                        print(f"Waiting {wait_time:.1f} seconds...")
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"Given up on {model_name} after retries.")
                elif "404" in e_str:
                    print(f"Model {model_name} not found.")
                    break # Don't retry 404
                else:
                    print(f"Error with {model_name}: {e}")
                    break
            
    print("All models failed.")
    return []

def verify_stock_data(ticker_symbol):
    """Yahoo Financeで最新データを取得し、基準を満たすか検証する"""
    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        
        # Ticker info keys vary slightly, trying robust fetch
        market_cap = info.get('marketCap', 0)
        trailing_per = info.get('trailingPE', 999.0)
        forward_per = info.get('forwardPE', trailing_per)
        price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        
        # Growth check (using revenue growth if available, else passing for manual review)
        rev_growth = info.get('revenueGrowth', 0)
        
        # Financial Health
        equity = info.get('totalStockholderEquity', 0)
        assets = info.get('totalAssets', 1) # Avoid div/0
        equity_ratio = equity / assets if assets > 0 else 0
        
        data = {
            "code": ticker_symbol,
            "name": info.get('longName', ticker_symbol),
            "price": price,
            "market_cap": market_cap,
            "per": forward_per if forward_per is not None else trailing_per,
            "revenue_growth": rev_growth,
            "equity_ratio": equity_ratio
        }
        
        # --- Screening Logic ---
        criteria_match = True
        
        if not (TARGET_CRITERIA["market_cap_min"] <= market_cap <= TARGET_CRITERIA["market_cap_max"]):
            criteria_match = False
            # print(f"  - Market Cap mismatch: {market_cap/100000000:.1f}億")
            
        if not (data["per"] <= TARGET_CRITERIA["per_max"]):
             # PEG check could be added here if PEG < 1
             peg = info.get('pegRatio', 99.0)
             if peg > 1.0:
                 criteria_match = False
                 # print(f"  - PER mismatch: {data['per']}")
        
        if not (data["revenue_growth"] >= TARGET_CRITERIA["revenue_growth_min"]):
            criteria_match = False
            # print(f"  - Low Growth: {data['revenue_growth']:.1%}")

        if criteria_match:
            print(f"MATCH: {data['name']} ({ticker_symbol})")
            return data
        else:
            # print(f"DROP: {data['name']} ({ticker_symbol}) mismatches criteria.")
            return None

    except Exception as e:
        print(f"Error verifying {ticker_symbol}: {e}")
        return None

def main():
    print("=== Stock Research Agent Started ===")
    
    # 1. Get Candidates
    candidates = get_candidates_from_gemini()
    if not candidates:
        print("No candidates found or API error.")
        return

    verified_stocks = []
    
    # 2. Verify Data
    print("\n=== Verifying Financial Data with Yahoo Finance ===")
    for cand in candidates:
        code = cand.get("code")
        if not code: continue
        
        # Ensure format "XXXX.T"
        if not code.endswith(".T"):
             # If it's just numbers, append .T
             if code.isdigit(): code = f"{code}.T"
        
        stock_data = verify_stock_data(code)
        if stock_data:
            # Merge Gemini's reason
            stock_data["gemini_reason"] = cand.get("reason", "")
            verified_stocks.append(stock_data)

    # 3. Output Results
    print(f"\n=== Result: {len(verified_stocks)} Stocks Qualified ===")
    
    # Limit to top 5 if more
    final_selection = verified_stocks[:5]
    
    # Append to CSV
    csv_path = "portfolio_sub.csv"
    current_date = datetime.now().strftime("%Y-%m-%d")
    shares_default = 100 # Default unit
    
    new_rows = []
    for s in final_selection:
        # Format: 銘柄コード,銘柄名,購入日,保有株数,購入単価
        row = f"{s['code']},{s['name']},{current_date},{shares_default},{s['price']}"
        new_rows.append(row)
        print(f"Adding: {row}")

    if new_rows:
        try:
            with open(csv_path, "a", encoding="utf-8") as f:
                for row in new_rows:
                    f.write(row + "\n")
            print(f"\nSuccessfully appended {len(new_rows)} stocks to {csv_path}")
        except Exception as e:
            print(f"Error writing to CSV: {e}")
            
    print("=== Task Completed ===")

if __name__ == "__main__":
    main()

`

## File: verify_fix.py

`python
import sys
import os
import pandas as pd
# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

# Mock streamlit to avoid import errors or warnings if possible, but importing stock_app imports streamlit
# We can just ignore the warnings.

try:
    from stock_app import scrape_japan_fund_history_params
except ImportError:
    # If run from different dir, adjust path
    sys.path.append(os.getcwd())
    from stock_app import scrape_japan_fund_history_params

print(">>> Verifying Fix for AJ311217")
df = scrape_japan_fund_history_params("AJ311217", None)

print(f"\nResult DataFrame Shape: {df.shape}")
if not df.empty:
    print(df)
    print("\nSUCCESS: DataFrame returned.")
else:
    print("\nFAILURE: Empty DataFrame.")

`

## File: verify_scraping.py

`python
import pandas as pd
from stock_app import scrape_japan_fund_history_params

code = "AJ312217" # Smart-i Gold Fund
print(f"Verifying data fetch for {code}...")

class MockStatus:
    def text(self, msg):
        print(f"Status: {msg}")

df = scrape_japan_fund_history_params(code, MockStatus())

if df.empty:
    print("FAILED: Returned DataFrame is empty.")
else:
    print(f"SUCCESS: Returned DataFrame with {len(df)} rows.")
    print(f"First Date: {df.index[0]}")
    print(f"Last Date: {df.index[-1]}")
    
    # Check duration
    duration = df.index[-1] - df.index[0]
    print(f"Duration: {duration.days} days")
    
    if duration.days > 365:
        print("VERIFICATION PASSED: Data covers more than 1 year.")
    else:
        print("VERIFICATION WARNING: Data covers less than 1 year.")

`

