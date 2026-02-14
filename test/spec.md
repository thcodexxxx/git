# 株式投資情報ニュースダッシュボード 実装計画

## 目標
PythonとStreamlitを使用して、投資家が市場の動向を素早く把握できるニュースダッシュボードを作成する。`yfinance`とRSSフィードを利用して、無料で信頼性の高い情報を集約する。

## ユーザーレビューが必要な事項
*   **データソース**: `yfinance`および公開されているRSSフィード（Yahoo Finance, Reutersなど）を使用します。特定の有料APIは使用しません。
*   **言語**: ニュースのソースによっては英語のコンテンツが含まれます。今回はそのまま表示するか、簡易的な翻訳ツール（Google Translateなど）を通すかは要検討ですが、まずは原文表示を基本とします。

## 提案する変更

### プロジェクト構造
```
project_root/
  ├── app.py                # メインアプリケーション
  ├── requirements.txt      # 依存ライブラリ
  ├── src/
  │   ├── __init__.py
  │   ├── data_loader.py    # データ取得ロジック (yfinance, RSS)
  │   ├── ui_components.py  # UIコンポーネント
  │   └── utils.py          # ユーティリティ
  └── .streamlit/
      └── config.toml       # テーマ設定
```

### 1. 環境構築
#### [NEW] [requirements.txt](file:///c:/Users/root/work/requirements.txt)
*   `streamlit`: Webアプリフレームワーク
*   `yfinance`: 株価・ニュース取得
*   `feedparser`: RSSフィード解析
*   `plotly`: インタラクティブなチャート
*   `pandas`: データ操作
*   `watchdog`: 開発時のホットリロード用（任意）

### 2. データ取得モジュール (`src/data_loader.py`)
*   **StockDataクラス**:
    *   `get_stock_info(ticker)`: 株価情報の取得
    *   `get_stock_news(ticker)`: `yfinance`経由で特定銘柄のニュース取得
    *   `get_historical_data(ticker)`: チャート用データ取得
*   **NewsFeedクラス**:
    *   `get_rss_feed(url)`: RSSフィードから最新ニュースを取得・解析
    *   定義済みRSSリスト（主要金融ニュースサイト）

### 3. UI実装 (`app.py`, `src/ui_components.py`)
*   **サイドバー**:
    *   表示モード切替（市場概況 / 個別銘柄）
    *   RSSソースの選択/フィルタリング
    *   銘柄検索ボックス
*   **メインエリア**:
    *   **Dashboard Mode**: 主要指数（S&P 500, Nikkei 225, USD/JPY）の現在値と、総合ニュースフィードをカード形式で表示。
    *   **Stock Mode**: 検索した銘柄のチャート（Candlestick）、主要指標、およびその銘柄に関連するニュースリスト。

## 検証計画

### 自動テスト
*   データ取得関数がエラーなくデータを返すかを確認する単体テスト（今回は小規模なため、手動検証を優先し、必要に応じて`pytest`を追加）。

### 手動検証
1.  **起動**: `streamlit run app.py` でアプリが起動すること。
2.  **データ表示**:
    *   主要指数が正常に表示されるか。
    *   RSSニュースが取得され、リンクが機能するか。
3.  **インタラクション**:
    *   銘柄コード（例: `AAPL`, `tm` (Toyota)）を入力して検索し、正しいチャートとニュースが表示されるか。
    *   サイドバーの切り替えがスムーズに行われるか。
