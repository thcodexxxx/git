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
