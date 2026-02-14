import streamlit as st
from src.data_loader import StockData, NewsFeed
import src.ui_components as ui

# Page Config
st.set_page_config(
    page_title="Stock News Dashboard",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
with open(".streamlit/style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

def main():
    st.title("📈 株式投資インサイト")

    # Sidebar
    st.sidebar.header("設定")
    mode = st.sidebar.radio("モード", ["ダッシュボード", "銘柄分析"])

    stock_data = StockData()
    news_feed = NewsFeed()

    if mode == "ダッシュボード":
        ui.render_dashboard(stock_data, news_feed)
    else:
        ui.render_stock_analysis(stock_data, news_feed)

if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError:
        # Create style.css if it doesn't exist to avoid error on first run
        with open(".streamlit/style.css", "w") as f:
            f.write("")
        main()
