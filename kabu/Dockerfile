FROM python:3.9-slim

WORKDIR /app

# 必要なライブラリのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコピー
COPY . .

# Cloud Runのポート設定（$PORTを環境変数として受け取る）
CMD streamlit run stock_app.py --server.port=${PORT} --server.address=0.0.0.0