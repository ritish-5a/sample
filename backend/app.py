from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app) # Security: Allows your website to talk to this script

@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    try:
        # 1. Fetch 2 Years of History
        stock = yf.Ticker(f"{symbol}.NS") # .NS for Indian Stocks
        df = stock.history(period="2y")
        
        if df.empty:
            return jsonify({"error": "Stock not found"}), 404

        # 2. Prepare Data for AI Analysis
        df['Date_Ordinal'] = pd.to_datetime(df.index).map(datetime.toordinal)
        X = np.array(df['Date_Ordinal']).reshape(-1, 1)
        y = np.array(df['Close']).reshape(-1, 1)

        # 3. Simple AI Prediction Model (Linear Regression)
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict price for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).toordinal()
        prediction = model.predict([[tomorrow]])[0][0]
        
        # 4. Format Data for Frontend
        chart_data = [{"time": str(date.date()), "value": float(price)} 
                      for date, price in zip(df.index, df['Close'])]

        return jsonify({
            "symbol": symbol,
            "currentPrice": round(float(df['Close'].iloc[-1]), 2),
            "prediction": round(float(prediction), 2),
            "trend": "Up" if prediction > df['Close'].iloc[-1] else "Down",
            "history": chart_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)