import streamlit as st
import plotly.graph_objects as go
import pandas as pd

def render_dashboard(stock_data, news_feed):
    st.markdown("### 🌍 世界の市場概況")
    
    # Key Indices Tickers
    indices = {
        "S&P 500": "^GSPC",
        "Nikkei 225": "^N225",
        "USD/JPY": "JPY=X"
    }

    cols = st.columns(len(indices))
    
    for idx, (name, ticker) in enumerate(indices.items()):
        with cols[idx]:
            info = stock_data.get_stock_info(ticker)
            if info:
                # Fallback logic for price
                current_price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
                previous_close = info.get('previousClose')
                
                delta = None
                if current_price and previous_close:
                    delta = current_price - previous_close
                    
                st.metric(
                    label=name, 
                    value=f"{current_price:,.2f}" if current_price else "N/A", 
                    delta=f"{delta:,.2f}" if delta else None
                )
            else:
                st.metric(label=name, value="Error")

    st.markdown("---")
    st.subheader("📰 最新の市場ニュース")
    
    news = news_feed.get_rss_feed("Yahoo Finance")
    
    if not news:
        st.info("現在、ニュースフィードは利用できません。")
    
    # News Grid Layout
    news_count = min(len(news), 10)
    rows = (news_count + 1) // 2
    
    for i in range(rows):
        col1, col2 = st.columns(2)
        idx1 = i * 2
        idx2 = i * 2 + 1
        
        with col1:
            if idx1 < news_count:
                entry = news[idx1]
                title = entry.get('title', 'No Title')
                link = entry.get('link', '#')
                published = entry.get('published', '')
                summary = entry.get('summary', entry.get('description', ''))
                # Truncate summary if too long
                if len(summary) > 100: summary = summary[:100] + "..."
                
                st.markdown(f"""
                <div class="news-card">
                    <div class="news-meta">{published}</div>
                    <a href="{link}" target="_blank" class="news-title">{title}</a>
                    <div class="news-summary">{summary}</div>
                </div>
                """, unsafe_allow_html=True)
                
        with col2:
            if idx2 < news_count:
                entry = news[idx2]
                title = entry.get('title', 'No Title')
                link = entry.get('link', '#')
                published = entry.get('published', '')
                summary = entry.get('summary', entry.get('description', ''))
                # Truncate summary if too long
                if len(summary) > 100: summary = summary[:100] + "..."

                st.markdown(f"""
                <div class="news-card">
                    <div class="news-meta">{published}</div>
                    <a href="{link}" target="_blank" class="news-title">{title}</a>
                    <div class="news-summary">{summary}</div>
                </div>
                """, unsafe_allow_html=True)

def render_stock_analysis(stock_data, news_feed):
    st.markdown("### 📊 銘柄分析")
    
    col_input, col_space = st.columns([1, 2])
    with col_input:
        ticker = st.text_input("銘柄コードを入力 (例: AAPL, 7203.T)", value="AAPL")
    
    if ticker:
        with st.spinner(f"{ticker} を分析中..."):
            info = stock_data.get_stock_info(ticker)
            
            if info:
                st.markdown(f"## {info.get('longName', ticker)} ({ticker})")
                
                # Main Metrics Row
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("現在値", f"{info.get('currentPrice', 'N/A')}")
                
                mcap = info.get('marketCap')
                if mcap:
                    # Format large numbers
                    if mcap >= 1e12: mcap_str = f"{mcap/1e12:.2f}兆" # Using 兆/Billion context approx or just T unit
                    elif mcap >= 1e9: mcap_str = f"{mcap/1e9:.2f}0億"
                    else: mcap_str = f"{mcap/1e6:.2f}百万"
                    # Ideally we keep T/B/M or adjust to Japanese units (兆/億/万). Let's stick to T/B/M for simplicity or standard finance notation, or try mixed.
                    # Let's revert to T/B/M but maybe label consistent? Sticking to English suffix is common in finance tools or use 兆/億.
                    # Let's use T/B/M as it's cleaner for universal logic, but label is Japanese.
                    if mcap >= 1e12: mcap_str = f"{mcap/1e12:.2f}T"
                    elif mcap >= 1e9: mcap_str = f"{mcap/1e9:.2f}B"
                    else: mcap_str = f"{mcap/1e6:.2f}M"
                else:
                    mcap_str = "N/A"
                    
                m2.metric("時価総額", mcap_str)
                m3.metric("PER (株価収益率)", f"{info.get('trailingPE', 'N/A')}")
                m4.metric("52週高値", f"{info.get('fiftyTwoWeekHigh', 'N/A')}")
                
                # Chart Section
                st.markdown("#### 📉 株価推移 (1年)")
                hist = stock_data.get_historical_data(ticker)
                
                if not hist.empty:
                    # Custom Dark Theme for Plotly
                    fig = go.Figure(data=[go.Candlestick(
                        x=hist.index,
                        open=hist['Open'],
                        high=hist['High'],
                        low=hist['Low'],
                        close=hist['Close'],
                        increasing_line_color='#238636', 
                        decreasing_line_color='#da3633'
                    )])
                    
                    fig.update_layout(
                        xaxis_rangeslider_visible=False,
                        paper_bgcolor='rgba(0,0,0,0)', # Transparent background
                        plot_bgcolor='rgba(0,0,0,0)',
                        font=dict(color='#c9d1d9'),
                        margin=dict(l=0, r=0, t=20, b=20),
                        height=400
                    )
                    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='rgba(255,255,255,0.1)')
                    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='rgba(255,255,255,0.1)')
                    
                    st.plotly_chart(fig, use_container_width=True)
                
                # Ticker News
                st.markdown("#### 🗞️ 関連ニュース")
                news = stock_data.get_stock_news(ticker)
                if news:
                    for item in news[:5]: # Limit to 5 items to keep it clean
                        with st.container():
                            st.markdown(f"**[{item.get('title', 'No Title')}]({item.get('link')})**")
                            publisher = item.get('publisher')
                            published = datetime.fromtimestamp(item.get('providerPublishTime', 0)).strftime('%Y-%m-%d %H:%M') if item.get('providerPublishTime') else "Recent"
                            st.markdown(f"<div class='news-meta'>配信: {publisher} • {published}</div>", unsafe_allow_html=True)
                            st.markdown("---")
                else:
                    st.info("この銘柄に関する特定のニュースは見つかりませんでした。")
            
            else:
                st.error("銘柄が見つかりません。シンボルを確認してください。")
