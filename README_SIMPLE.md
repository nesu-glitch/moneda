# Moneda — Plain-language guide

Moneda is a personal finance app that lives in your browser. You upload a file from your bank and it shows you where your money went. That is all it does, and it does it without sending your data anywhere.

Live site: https://nesu-glitch.github.io/moneda/

No installation needed to use the live site. Just open it in any browser.

---

## What your data stays private means

There is no server. There is no account. There is no database. When you upload your bank file, it is read directly by your browser — the same way a Word document is opened by Word. The data is held in the browser tab's memory and disappears when you close the tab.

The only way your data leaves your device is if you share the exported file yourself.

---

## How to use it

### Step 1 — Download your bank file

Log in to your online banking website. Go to your account movements or transaction history. Look for a Download or Export button and choose Excel format (.xlsx). Save the file to your computer.

### Step 2 — Open Moneda

Go to https://nesu-glitch.github.io/moneda/ in your browser.

The first time you open it, a short setup wizard asks you to choose a language, a visual theme, and a financial goal. This takes about a minute.

### Step 3 — Upload your file

Click the Data tab (bottom of the screen on a phone, top-right on a computer). Drag your bank file onto the upload area, or click to browse for it. Moneda reads it and shows your transactions straight away.

### Step 4 — Explore

- The Home tab shows a summary: total income, total spending, and a chart of spending by category.
- The Budgets tab lets you set a monthly spending limit for each category (for example, 150 euros on groceries).
- The Auto Pay tab lists your recurring charges and subscriptions with a countdown to the next payment date.
- The Splits tab lets you divide a shared expense among friends and calculates who owes what.
- The Reminders tab is a simple to-do list for money-related tasks.

### Step 5 — Save your work

Moneda does not save automatically. When you want to come back later, click the Export button. This downloads a file to your computer. Next time you open Moneda, upload that file instead of the bank file — all your categories, budgets, notes and split groups will be restored exactly as you left them.

---

## Supported banks

Moneda can read export files from the following Spanish banks:

- Santander
- BBVA
- CaixaBank
- Bankinter
- Sabadell
- ING
- Unicaja
- Kutxabank
- Openbank

If your bank is not on the list, try uploading its Excel export anyway. Moneda uses a flexible column-detection system and will often recognise the format automatically.

---

## Running it on your own computer (optional)

If you want to run Moneda locally instead of using the live site, you need Node.js installed (free download at nodejs.org). Then:

1. Download or clone this repository.
2. Open a terminal in the project folder.
3. Run `npm install` once to download dependencies.
4. Run `npm run dev` to start the app.
5. Open `http://localhost:5173` in your browser.

To stop the app, press Ctrl+C in the terminal.

---

## Questions

**Can Moneda see my bank password?**
No. You export a file from your bank's website yourself. Moneda never connects to your bank.

**What happens if I accidentally close the tab?**
Your data is gone unless you exported first. Export often, especially after making changes.

**Can I use it on my phone?**
Yes. The live site works on any modern smartphone browser. You can also install it as an app from your browser's menu (Add to Home Screen).

**Is it free?**
Yes, completely free and open source.
