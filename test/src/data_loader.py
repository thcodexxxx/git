import yfinance as yf
import feedparser
import pandas as pd
from datetime import datetime

class StockData:
    def get_stock_info(self, ticker):
        """
        Get stock information for a given ticker.
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            return info
        except Exception as e:
            print(f"Error fetching stock info: {e}")
            return None

    def get_stock_news(self, ticker):
        """
        Get news for a given ticker using yfinance.
        """
        try:
            stock = yf.Ticker(ticker)
            news = stock.news
            return news
        except Exception as e:
            print(f"Error fetching stock news: {e}")
            return []

    def get_historical_data(self, ticker, period="1y"):
        """
        Get historical market data.
        """
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period=period)
            return hist
        except Exception as e:
            print(f"Error fetching historical data: {e}")
            return pd.DataFrame()

class NewsFeed:
    def __init__(self):
        self.feed_urls = {
            "Yahoo Finance": "https://news.yahoo.co.jp/rss/topics/business.xml", # Yahoo Japan Business
        }

    def get_rss_feed(self, source="Yahoo Finance"):
        """
        Fetch and parse RSS feed.
        """
        url = self.feed_urls.get(source)
        if not url:
            return []
        
        try:
            feed = feedparser.parse(url)
            return feed.entries
        except Exception as e:
            print(f"Error fetching RSS feed: {e}")
            return []
