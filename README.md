[README.md](https://github.com/user-attachments/files/31733999/README.md)
# TrendSage — AI Upstox Stock Tracker

Full-stack app: live NSE/BSE quotes, 2-year historical charts, A–Z searchable
instrument list, and an explainable AI trend-projection model — all built on
the Upstox API.

**Stack:** React + Vite + Tailwind (frontend) · Node.js + Express + MongoDB (backend) · Upstox API (data)

---

## 0. Prerequisites

- Node.js 18+ and npm
- MongoDB (local install, or a free Atlas cluster: https://www.mongodb.com/cloud/atlas)
- An Upstox trading account: https://upstox.com
- A registered Upstox Developer app: https://upstox.com/developer/apps
  (gives you `API_KEY` / `API_SECRET` and lets you set a redirect URI)

---

## 1. Get the code onto your machine

Unzip the project. You'll have two folders: `backend/` and `frontend/`.

```
upstox-ai-tracker/
├── backend/
└── frontend/
```

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in real values:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | Your local Mongo URL or Atlas connection string |
| `JWT_SECRET`, `COOKIE_SECRET` | Generate with `openssl rand -hex 32` — **never reuse example values** |
| `UPSTOX_API_KEY` / `UPSTOX_API_SECRET` | From your app at upstox.com/developer/apps |
| `UPSTOX_REDIRECT_URI` | Must **exactly** match what you registered in the Upstox app settings, e.g. `http://localhost:5000/api/auth/upstox/callback` |

Seed the searchable instrument list (all NSE/BSE stocks A–Z) once:

```bash
npm run seed:instruments
```

This downloads Upstox's public instrument master and stores it in MongoDB —
this is what powers the letter-by-letter and free-text search. Re-run it
daily (the server already schedules this automatically at 7:30 AM IST via
`node-cron` in `server.js`).

Start the backend:

```bash
npm run dev
```

You should see `Server running on port 5000` in the terminal. Visit
`http://localhost:5000/api/health` — you should get `{"success":true,"status":"ok"}`.

## 3. Frontend setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Vite proxies `/api` calls to your backend on
port 5000 (configured in `vite.config.js`), so both must be running.

## 4. First-run walkthrough

1. Go to `http://localhost:5173` → redirected to `/login`.
2. Register a new account (name, email, password — 8+ chars).
3. You'll land on the Dashboard. Click **Connect Upstox**.
4. You're redirected to Upstox's consent screen → log in with your Upstox
   credentials → approve.
5. You're bounced back to the dashboard with `?upstox=connected` — your
   Upstox access token is now stored (server-side, encrypted at rest is
   recommended — see Security Checklist) against your account.
6. Use the search bar or click any A–Z letter to browse the full stock list.
7. Click a stock → see the live quote, 2-year price chart (1M/6M/1Y/2Y
   toggle), and click **Generate** under AI Trend Projection to run the model.

---

## 5. How the AI prediction actually works

`backend/services/predictionService.js` runs an **explainable statistical
model**, not a black box:

- Linear regression across 2 years of daily closes → trend slope + projected
  prices for the next N days.
- 20-day and 50-day simple moving averages → bullish/bearish/neutral signal
  (classic golden-cross/death-cross logic).
- R² of the regression fit is reported as a "confidence" score.

This is intentionally transparent and cheap to run. **It is not a promise of
future returns** — the API response always includes a `disclaimer` field, and
the UI always renders it. Do not remove this in production; in India,
presenting price predictions as certain outcomes without proper disclosures
can run into SEBI investment-advisory regulations.

### Upgrading to a real ML model later
Swap `predictionService.js`'s internals for a call to a Python microservice
running an LSTM (TensorFlow/Keras) or Facebook Prophet model trained on the
same 2-year candle data. Keep the same response shape
(`signal`, `confidence`, `projectedPrices`, `disclaimer`) so the frontend
doesn't need to change.

---

## 6. Security checklist (already implemented, review before going live)

- ✅ Passwords hashed with bcrypt (cost factor 12), never stored in plaintext
- ✅ Auth via **httpOnly, sameSite=strict** cookies — not localStorage — so
  a JS-injection (XSS) bug can't steal the session token
- ✅ `helmet` sets secure headers (CSP, HSTS, X-Content-Type-Options, etc.)
- ✅ CORS locked to your exact frontend origin, not `*`
- ✅ `express-mongo-sanitize` strips `$`/`.` from input to block NoSQL injection
- ✅ Joi schema validation on every write endpoint, unknown fields stripped
- ✅ Rate limiting: 200 req/15min globally, 10 req/15min on login/register
  (brute-force mitigation)
- ✅ Request body size capped at 10kb
- ✅ Centralized error handler that never leaks stack traces in production
- ⬜ **Before production:** put the backend behind HTTPS (e.g. via a
  reverse proxy or your host's managed TLS), set `NODE_ENV=production`,
  and encrypt `upstoxAccessToken` at rest (e.g. with `crypto` AES-256-GCM
  using a key from a secrets manager) rather than storing it plain in Mongo
- ⬜ Add 2FA for login if you'll hold real brokerage tokens for many users
- ⬜ Rotate `JWT_SECRET`/`COOKIE_SECRET` periodically; never commit `.env`

---

## 7. Deployment (typical free-tier path)

| Piece | Recommended host |
|---|---|
| Frontend (`frontend/dist` after `npm run build`) | Vercel or Netlify |
| Backend | Render, Railway, or a small VPS |
| MongoDB | MongoDB Atlas free tier |

Steps:
1. `cd frontend && npm run build` → deploy the `dist/` folder to Vercel.
2. Deploy `backend/` to Render/Railway; set all `.env` variables in their
   dashboard's environment settings (never commit `.env`).
3. Update `UPSTOX_REDIRECT_URI` in both your `.env` **and** your Upstox
   Developer app settings to the new public backend URL.
4. Update `CLIENT_URL` in the backend `.env` to your deployed frontend URL
   (needed for CORS + the post-OAuth redirect).
5. Set up a daily cron (Render/Railway cron jobs, or keep `node-cron` in
   `server.js` if the service stays always-on) to re-run
   `npm run seed:instruments`.

---

## 8. Feature checklist this scaffold covers

- [x] User accounts (register/login/logout) with secure sessions
- [x] Upstox OAuth linking per user
- [x] A–Z browsable + free-text search across **all** NSE/BSE listed equities
- [x] Live quote lookup per stock
- [x] 2-year daily historical chart with 1M/6M/1Y/2Y range toggle
- [x] Explainable AI trend signal + N-day price projection with disclaimer
- [x] Personal watchlist
- [x] Rate limiting, input validation, secure headers, injection protection
- [ ] Not included (natural next steps): push/email price alerts, portfolio
      P&L import, options-chain view, multi-timeframe candles (weekly/monthly),
      dark/light theme toggle, admin analytics dashboard
