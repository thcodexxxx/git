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