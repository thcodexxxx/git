import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

# 設定: 日付の年を2025年に補正して取得する場合は True にする
target_year_correction = False  
target_year = 2025

def get_historical_price(ticker, date_str):
    try:
        # 日付のパース
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        
        # 年の補正（オプション）
        if target_year_correction:
            date_obj = date_obj.replace(year=target_year)
            
        # 検索範囲（該当日〜5日後）を設定して、最初の営業日を探す
        start_date = date_obj
        end_date = date_obj + timedelta(days=5)
        
        # データ取得
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_date.strftime('%Y-%m-%d'), 
                             end=end_date.strftime('%Y-%m-%d'))
        
        if not hist.empty:
            # 最も古い日付（該当日または直後の営業日）の終値を返す
            return round(hist.iloc[0]['Close'], 1)
        else:
            return None # データ取得失敗または未来の日付
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

# CSVファイルの読み込み
input_file = 'portfolio_corrected.csv'

# 【修正】ヘッダーがないファイルとして読み込み、列名を強制的に割り当てます
df = pd.read_csv(input_file, header=None, names=['Ticker', 'Name', 'PurchaseDate', 'Quantity', 'PurchasePrice'])

print("株価の修正を開始します...")

# 各行の株価を修正
for index, row in df.iterrows():
    ticker = row['Ticker']
    original_date = row['PurchaseDate']
    
    # 株価を取得
    correct_price = get_historical_price(ticker, original_date)
    
    if correct_price is not None:
        print(f"修正: {ticker} ({original_date}) {row['PurchasePrice']} -> {correct_price}")
        df.at[index, 'PurchasePrice'] = correct_price
    else:
        print(f"スキップ: {ticker} ({original_date}) - データが見つかりません")

# 結果を保存
output_file = 'portfolio_fixed.csv'
df.to_csv(output_file, index=False)
print(f"修正完了。'{output_file}' に保存しました。")