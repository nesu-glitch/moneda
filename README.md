# Moneda 💸

Personal finance tracker — upload your bank export and get instant dashboards, budgets, and spending insights. **100% client-side. Your data never leaves your browser.**

🌐 **Live app:** https://nesu-glitch.github.io/moneda/

---

## Supported banks

| Bank | Country |
|---|---|
| Santander | 🇪🇸 Spain |
| BBVA | 🇪🇸 Spain |
| CaixaBank | 🇪🇸 Spain |
| Bankinter | 🇪🇸 Spain |
| Sabadell | 🇪🇸 Spain |
| ING | 🇪🇸 Spain |
| Unicaja | 🇪🇸 Spain |
| Kutxabank | 🇪🇸 Spain |
| Openbank | 🇪🇸 Spain |
| Revolut | 🌍 Multi-country |
| N26 | 🌍 Multi-country |
| Wise | 🌍 Multi-country |

Upload a `.xlsx` export from any of these and Moneda auto-detects the format.

---

## Privacy

> **Your bank data never leaves your device.** No server, no account, no analytics, no data collection. Everything is parsed and stored entirely in your browser tab. Closing the tab clears all data (use **Export** to save your session).

---

## Tech stack

| Layer | Tool |
|---|---|
| UI | React 19 |
| Build | Vite 8 |
| Charts | Recharts |
| Excel | SheetJS (xlsx) |
| Hosting | GitHub Pages / Netlify / any static host |

---

## Local development

**Prerequisites:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/nesu-glitch/moneda.git
cd moneda
npm install
npm run dev
```

App runs at `http://localhost:5173` with HMR.

---

## Production build

```bash
npm run build
```

Output goes to `dist/`. Fully static — no server needed.

Preview locally:

```bash
npm run preview
# → http://localhost:4173
```

---

## Deploy to GitHub Pages

```bash
npm run deploy
```

This runs `npm run build` then pushes `dist/` to the `gh-pages` branch automatically. Your app will be live at `https://nesu-glitch.github.io/moneda/` within a minute.

---

## Other deploy options

### Netlify (drag & drop — no account needed)

1. Run `npm run build`
2. Go to [netlify.com/drop](https://netlify.com/drop)
3. Drag the `dist/` folder onto the page
4. Get a live URL instantly

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Self-hosted (nginx)

```bash
npm run build
# copy dist/ to your server
```

```nginx
server {
  listen 80;
  root /var/www/moneda;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
```

---

## Project structure

```
src/
  App.jsx          # Entire app — components, state, logic
public/
  icons/           # PWA icons
scripts/
  gen-icons.js     # Regenerate PWA PNG icons from SVG
dist/              # Built output (generated, not committed)
```

---

## Key features

- Upload one or multiple bank `.xlsx` exports
- Auto-categorises transactions (rules + merchant memory)
- Subscriptions & recurring payment detection
- Budgets with monthly/weekly view
- Partial & full reimbursement tracking
- Multi-sheet Excel export (saves all state — re-upload to restore)
- 4 themes: Nature, Adventure, Princess, Finance Pro
- PWA — installable on mobile, works offline
- 100% offline — nothing sent to any server

---

© 2026 Inés Villarino — MIT License
