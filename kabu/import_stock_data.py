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
