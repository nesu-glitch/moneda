# Moneda

Personal finance tracker that parses Spanish bank export files and runs entirely in the browser. No server, no account, no data leaves your device.

Live app: https://nesu-glitch.github.io/moneda/

## What it does

Upload a `.xlsx` export from your bank and Moneda will:

- Parse transactions and auto-categorise them using merchant detection rules and a learned merchant memory
- Show a dashboard with income, expenses, net balance and a category breakdown chart
- Let you set monthly budgets per category with weekly pro-rata view
- Detect recurring subscriptions and track auto-pay commitments with a countdown to next charge
- Support bill splitting across groups of people with automatic minimum-transfer settlement
- Export everything back to `.xlsx`, including budgets, reminders, auto-payments and split data
- Run a multi-step onboarding wizard with theme selection and goal setting
- Work offline as a PWA once installed

All state lives in React `useState`. Nothing is persisted unless you explicitly export.

## Tech stack

| Package | Version | Role |
|---|---|---|
| React | ^19.2.6 | UI framework |
| Vite | ^8.0.12 | Build tool and dev server |
| @e965/xlsx | ^0.20.3 | Spreadsheet parsing and export (CVE-patched SheetJS fork) |
| Recharts | ^3.8.1 | Bar charts on the dashboard |
| vite-plugin-pwa | ^1.3.0 | Service worker and offline support |

## Folder structure

```
src/
  App.jsx                   Root — imports, state wiring, layout (114 lines)

  components/
    Budget.jsx              BudgetWizard + BudgetsPage
    CategoryReview.jsx      Drag-and-drop transaction classifier modal
    Dashboard.jsx           Dashboard, BudgetWidget, MerchantBreakdown, ComparePanel
    Onboarding.jsx          NPC Dialog typewriter + multi-stage welcome flow
    Reminders.jsx           RemindersPage
    Splits.jsx              SplitExpenseForm, SplitModal, SplitsPage
    StepProgress.jsx        Shared step-indicator bar used by wizard modals
    Subscriptions.jsx       SubscriptionVerify + AutoPayPage
    Toast.jsx               Auto-dismiss notification
    Transactions.jsx        Shared TxnRow, ReimPanel, FullLedger
    Upload.jsx              DataPage — file upload and full transaction ledger

  hooks/
    useAppData.js           Derived values: totals, filtered txns, budget warnings, step indices
    useBudgets.js           Budget limits and category-group state
    useCategories.js        Custom categories and merchant memory
    useExport.js            Excel export orchestration
    useIsMobile.js          Debounced window resize listener
    useTransactions.js      Upload pipeline, subscription detection, category-review flow

  utils/
    allCats.js              Master category list with extendAllCats() for custom additions
    categories.js           Rule-based merchant categorisation
    constants.js            Themes, translations (T), goals, category labels, colours (CC)
    filters.js              getRange, filterTxns, compFilterKey
    format.js               fmt, fmtD, fmtShort, NOW
    parsers/index.js        parseBankExport + doExport — all spreadsheet I/O
    recurring.js            Subscription and recurring-payment detection heuristics
    sanitize.js             sanitizeCellValue — formula injection guard
```

## How to run

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build → dist/
npm run preview    # serve dist/ locally at http://localhost:4173
```

## How to deploy

```bash
npm run deploy
```

Runs `npm run build` then pushes `dist/` to the `gh-pages` branch via the `gh-pages` package. Requires GitHub Pages to be enabled on that branch in the repository settings.

## Supported banks

The parser auto-detects the bank from the first rows of the spreadsheet and applies bank-specific column mappings:

- Santander
- BBVA
- CaixaBank (including La Caixa)
- Bankinter
- Sabadell
- ING
- Unicaja
- Kutxabank
- Openbank

Any other export file with recognisable date, description and amount column headers will be parsed using generic score-based header detection.

Moneda's own `.xlsx` export format is also re-importable, restoring transactions, categories, budgets, reminders, auto-payments and split group data in full.

## Security

**Formula injection.** Every string value read from a spreadsheet cell passes through `sanitizeCellValue` in `src/utils/sanitize.js` before use. Values starting with `=`, `+`, `-` or `@` are stripped to prevent formula injection if data is later opened in Excel or Google Sheets.

**Dependency audit.** `.github/workflows/security.yml` runs `npm audit --audit-level=high` on every push to `main`. The CI job fails if any high or critical vulnerability is present.

**CVE-patched dependency.** The `xlsx` package is aliased to `@e965/xlsx@^0.20.3`, a maintained fork that resolves the prototype-pollution CVEs present in the original SheetJS 0.18.x releases.

**No network.** The app makes no outbound requests with user data. All parsing runs in-memory in the browser.
