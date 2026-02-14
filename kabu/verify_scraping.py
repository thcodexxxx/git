import pandas as pd
from stock_app import scrape_japan_fund_history_params

code = "AJ312217" # Smart-i Gold Fund
print(f"Verifying data fetch for {code}...")

class MockStatus:
    def text(self, msg):
        print(f"Status: {msg}")

df = scrape_japan_fund_history_params(code, MockStatus())

if df.empty:
    print("FAILED: Returned DataFrame is empty.")
else:
    print(f"SUCCESS: Returned DataFrame with {len(df)} rows.")
    print(f"First Date: {df.index[0]}")
    print(f"Last Date: {df.index[-1]}")
    
    # Check duration
    duration = df.index[-1] - df.index[0]
    print(f"Duration: {duration.days} days")
    
    if duration.days > 365:
        print("VERIFICATION PASSED: Data covers more than 1 year.")
    else:
        print("VERIFICATION WARNING: Data covers less than 1 year.")
