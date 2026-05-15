# Contributing to Moneda 💸

Thanks for taking the time to help! Every contribution — whether it's testing a bank export, reporting a bug, or suggesting a feature — genuinely makes Moneda better for everyone.

---

## How Moneda works (important context)

Moneda is **privacy-first by design**:

- **No backend.** There is no server, no database, no API.
- **No accounts.** Nothing to sign up for.
- **No data collection.** Zero analytics, zero tracking.
- **Everything runs in the browser.** Your bank data is parsed locally and never leaves your device.

This means all contribution work is purely front-end. There is nothing to deploy on a server side.

---

## Ways to contribute

### 🏦 Test a bank export

The most valuable thing you can do is test your own bank's `.xlsx` export and report whether it parses correctly.

Open an issue using the **"Bank not working / add bank support"** template — it guides you through sharing only the column headers (not real transaction data).

### 🐛 Report a bug

Use the **"Bug report"** template. Screenshots are very helpful. Please make sure no real financial data is visible in any screenshot.

### 💡 Suggest a feature

Use the **"Feature request"** template. Explain the problem you're trying to solve — that context helps a lot.

### 🔧 Submit code

See the local dev setup below. All contributions welcome — just open a pull request.

---

## Local development

**Prerequisites:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/nesu-glitch/moneda.git
cd moneda
npm install
npm run dev
```

The app runs at `http://localhost:5173` with hot module reloading.

---

## Build and deploy

```bash
npm run build       # produces dist/
npm run deploy      # builds + pushes dist/ to gh-pages branch
```

---

## Code structure

> Everything is in one `src/App.jsx` file by design — for simplicity and portability.

There is no complex folder structure to navigate. Open `src/App.jsx` and search for what you need.

Other files worth knowing:

| File | Purpose |
|---|---|
| `vite.config.js` | Vite + PWA configuration |
| `public/` | Static assets, PWA icons, `.nojekyll`, `404.html` |
| `scripts/gen-icons.js` | Regenerate PWA PNG icons from SVG |

---

## Privacy rules for contributors

- **Never commit real financial data.** Not in test files, not in screenshots, not in comments.
- If you're adding a bank parser, use made-up transactions (e.g. `"Coffee shop", 3.50, 2025-01-01`).
- Strip any personal data before attaching files to issues or pull requests.
