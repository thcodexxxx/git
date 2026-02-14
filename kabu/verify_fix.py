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
