# Moneda 💸 — How to run it on your computer

Moneda is a personal finance app that works entirely in your browser.  
**Your bank data never leaves your device.** No account. No internet required after setup.

🌐 **Already online (no setup needed):** https://nesu-glitch.github.io/moneda/

---

## Supported banks

Moneda can read export files from: **Santander, BBVA, CaixaBank, Bankinter, Sabadell, ING, Unicaja, Kutxabank, Openbank, Revolut, N26, Wise**

---

## What you need first

You need to install two free programs before anything else.  
You only do this once.

### Step 1 — Install Node.js

Node.js is the engine that runs the app on your computer.

1. Go to **[nodejs.org](https://nodejs.org)**
2. Click the big green button that says **"LTS"** (the recommended version)
3. Download and run the installer
4. Click Next → Next → Install → Finish

To check it worked: open the **Command Prompt** (press `Windows key`, type `cmd`, press Enter) and type:

```
node --version
```

You should see something like `v22.0.0`. Any number is fine as long as it shows up.

---

### Step 2 — Download Moneda

If you received Moneda as a ZIP file:

1. Right-click the ZIP file → **Extract All**
2. Choose a folder you'll remember (e.g. your Desktop or Documents)
3. Open the extracted folder — it's called `moneda`

---

### Step 3 — Install Moneda's pieces (one time only)

1. Open the `moneda` folder
2. Click on the address bar at the top of the window (where it shows the folder path)
3. Type `cmd` and press **Enter** — a black Command Prompt window opens *inside that folder*
4. Type this exactly and press Enter:

```
npm install
```

Wait for it to finish (it downloads some files, takes 1–2 minutes). You'll see a blinking cursor when it's done.

---

### Step 4 — Start the app

In the same black window, type:

```
npm run dev
```

You'll see some text appear, including a line like:

```
➜  Local:   http://localhost:5173/
```

5. Open your browser (Chrome, Edge, Firefox — any works)
6. Type `http://localhost:5173` in the address bar and press Enter
7. Moneda opens! 🎉

> **Keep the black window open** while you use the app. Closing it stops the app.

---

### Every time you want to use Moneda again

1. Open the `moneda` folder
2. Click the address bar, type `cmd`, press Enter
3. Type `npm run dev` and press Enter
4. Open your browser and go to `http://localhost:5173`

---

## How to use Moneda

### Upload your bank data

1. Log in to your online banking
2. Go to your account movements / transactions
3. Look for a **Download** or **Export** button → choose **Excel (.xlsx)**
4. Save the file anywhere on your computer

Back in Moneda:

1. Click the **Data** tab (bottom right on mobile, top right on desktop)
2. Drag your `.xlsx` file onto the upload box, or click **Choose file(s)**
3. Moneda reads the file and shows your transactions instantly

---

### Save your work

Moneda keeps everything in memory while the browser tab is open.  
To save and come back later:

1. Click **📥 Export** (anywhere in the app)
2. Save the downloaded `.xlsx` file somewhere safe
3. Next time: upload *that* file instead of the bank export — all your categories, budgets, and notes come back automatically

---

### What each tab does

| Tab | What it's for |
|---|---|
| 🏠 Home (Overview) | Dashboard — charts, spending summary, budgets at a glance |
| 🎯 Budgets | Set monthly spending limits per category |
| 📋 Reminders | Add to-dos and recurring notes |
| 💳 Auto Pay | Track subscriptions and recurring charges |
| 📂 Data | Upload files, view all transactions, export |

---

## Putting it on the internet (optional)

If you want to access Moneda from any device (phone, other computer) without running it locally, you can host it for free on **Netlify** — no technical knowledge needed.

### Free hosting on Netlify (5 minutes)

1. Create a free account at [netlify.com](https://netlify.com)
2. In the black Command Prompt window (in the `moneda` folder), type:

```
npm run build
```

Wait for it to finish. A new folder called `dist` appears inside `moneda`.

3. Go to [netlify.com/drop](https://netlify.com/drop) in your browser
4. Drag the **`dist` folder** onto the page
5. Netlify gives you a link like `https://random-name-123.netlify.app`
6. Open that link on any device — Moneda is live!

> You can repeat steps 2–5 any time you want to update the hosted version.

---

## Troubleshooting

**"npm is not recognized"**  
→ Node.js didn't install correctly. Restart your computer and try again. If still broken, reinstall from [nodejs.org](https://nodejs.org).

**The browser shows "This site can't be reached"**  
→ The black Command Prompt window was closed. Reopen it, navigate to the `moneda` folder, and run `npm run dev` again.

**"Port 5173 is already in use"**  
→ Moneda is already running in another window. Just go to `http://localhost:5173` in your browser.

**I accidentally closed the browser tab**  
→ Just go back to `http://localhost:5173`. The app is still running.

**I want to stop Moneda**  
→ Click the black Command Prompt window and press `Ctrl + C`.
