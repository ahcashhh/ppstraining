# The Peri Peri Shack — Staff Training Portal
## Complete Setup Guide (Multi-Location)

This guide will take you from zero to a live training website in about 30–45 minutes. No technical experience needed — just follow each step carefully.

---

## What you'll have at the end

- A website staff visit on any phone or computer
- Staff log in with their 4-digit PIN and watch YouTube training videos
- They take a quiz after each video (must score 85%+ to pass)
- Each location has a **supervisor** who logs in with a password and sees only their store's staff
- You log in as **owner/admin** (PIN 6969) and can view all locations or switch between them

**Total cost: £0 / $0**

---

## PART 1 — Set Up Your Google Sheet (the database)

### Step 1: Create a new Google Sheet

1. Go to **sheets.google.com** (sign in with your Gmail account)
2. Click the big **+** button to create a blank spreadsheet
3. Name it **"Peri Peri Shack Training"** (click "Untitled spreadsheet" at the top)

### Step 2: Open the Apps Script editor

1. In your spreadsheet, click **Extensions** in the top menu
2. Click **Apps Script**
3. A new tab will open — this is where your backend code lives

### Step 3: Paste the backend code

1. In the Apps Script editor, select all existing code (Ctrl+A) and delete it
2. Open **apps-script.js** from your `D:\claude\pps` folder in Notepad
3. Select all (Ctrl+A), copy (Ctrl+C)
4. Paste it into the Apps Script editor (Ctrl+V)
5. Click **Save** (floppy disk icon or Ctrl+S)

> Your admin PIN is already set to **6969** in the file. You can change it on line 4 if you want a different PIN. If you change it, also search for `adminPin` in training-portal.html and update it there too.

### Step 4: Create all the spreadsheet sheets (one-time setup)

1. In the Apps Script editor, click the **function dropdown** at the top (it may say "doGet")
2. Select **setupSheets** from the list
3. Click the **▶ Run** button
4. A popup asks for permissions — click **Review permissions → choose your Gmail → Allow**
5. Wait for "Execution completed" to appear at the bottom

Go back to your Google Sheet — you should now see **6 coloured tabs**: Locations, Supervisors, Employees, Videos, Quizzes, Progress.

---

## PART 2 — Deploy the Backend as a Web App

### Step 5: Deploy your script

1. In the Apps Script editor, click the blue **Deploy** button (top right)
2. Click **New deployment**
3. Click the gear/cog icon next to "Type" → select **Web app**
4. Fill in:
   - **Execute as**: Me
   - **Who has access**: **Anyone** ← critical, don't skip this
5. Click **Deploy** → **Authorise access** if prompted
6. You'll see a **Web app URL** — copy it (looks like `https://script.google.com/macros/s/AKfyc.../exec`)

> **Already deployed before?** If you previously deployed an older version of the script, go to Deploy → Manage deployments → Edit (pencil icon) → change Version to "New version" → Deploy. This updates your existing URL.

---

## PART 3 — Set Up the Website

### Step 6: Add your Apps Script URL to the website

The URL is already hardcoded in your `training-portal.html` from when I set it up. If you re-deployed and got a **new** URL, you'll need to update it:

1. Right-click **training-portal.html** in `D:\claude\pps` → Open with Notepad
2. Press Ctrl+F and search for `script.google.com`
3. Replace the entire existing URL with your new one (keep the quotes around it)
4. Save the file (Ctrl+S)

### Step 7: Re-upload to Netlify

1. Go to **netlify.com** and log in
2. Go to your existing site → **Deploys** tab
3. Drag and drop your updated **training-portal.html** into the deploy area
4. The site updates in seconds

---

## PART 4 — Set Up Locations and Supervisors

This is the most important part for multi-location use. Do this in your Google Sheet.

### Step 8: Add your locations

1. In your Google Sheet, click the **Locations** tab
2. Delete the example rows (Downtown, Westside)
3. Add your real locations, one per row:

| LocationID | LocationName |
|------------|--------------|
| LOC001 | Peri Peri Shack City Centre |
| LOC002 | Peri Peri Shack Westside |
| LOC003 | Peri Peri Shack Airport |

You can name the LocationIDs anything you like — just keep them short and consistent. You'll use them in the next step.

### Step 9: Add your supervisors

1. Click the **Supervisors** tab
2. Delete the example rows
3. Add one row per supervisor:

| Password | Name | LocationID |
|----------|------|------------|
| citycentre2024 | Sarah Johnson | LOC001 |
| westside2024 | Marcus Brown | LOC002 |
| airport2024 | Lisa Chen | LOC003 |

- **Password**: This is what the supervisor types to log in. Make it something memorable but not obvious. You choose it — supervisors don't set their own.
- **Name**: Their name as it appears in their dashboard header
- **LocationID**: Must exactly match the LocationID you used in the Locations tab

### Step 10: Add your staff members

Click the **Employees** tab. Each row is one staff member:

| PIN | Name | Role | LocationID | DateAdded |
|-----|------|------|------------|-----------|
| 1234 | John Smith | Kitchen | LOC001 | (leave blank) |
| 5678 | Amy Taylor | Front of House | LOC002 | (leave blank) |

- **PIN**: A 4-digit number they use to log in. You choose it. If you want PINs starting with 0 (like 0042), format that column as **Plain Text** first: select the PIN column → Format → Number → Plain Text.
- **LocationID**: Must match a LocationID from the Locations tab

You can also add staff through the admin dashboard — log in with PIN 6969 and use the Add Staff form.

---

## PART 5 — Add Training Content

### Step 11: Add your YouTube videos

Click the **Videos** tab and fill in rows:

| VideoID | Title | YouTubeURL | Description | Order |
|---------|-------|------------|-------------|-------|
| VID001 | Food Safety & Hygiene | https://youtube.com/watch?v=... | Learn our food safety standards. | 1 |
| VID002 | Customer Service | https://youtube.com/watch?v=... | How we treat every guest. | 2 |

> **Set your YouTube videos to Unlisted** — anyone with the link can watch but they won't appear in search results.

Videos and quizzes are **shared across all locations** — every location's staff watches the same training content.

### Step 12: Add quiz questions

Click the **Quizzes** tab. Each row = one question:

| VideoID | Question | OptionA | OptionB | OptionC | OptionD | Correct |
|---------|----------|---------|---------|---------|---------|---------|
| VID001 | How often should you wash your hands? | Once per hour | Before and after handling food | Start of shift only | When visibly dirty | B |

- **VideoID**: Must exactly match the VideoID in the Videos tab
- **Correct**: Must be A, B, C, or D (capital letter)

Add as many questions per video as you like. Staff need 85%+ correct to pass.

---

## PART 6 — How It All Works Day-to-Day

### Staff
1. Go to your Netlify URL on any phone or computer
2. Enter their 4-digit PIN
3. Tap a training module, watch the video, take the quiz
4. Need 85%+ to pass — can retry immediately if they fail

### Supervisors
1. Go to your Netlify URL
2. Tap **"Supervisor / Manager Login →"** at the bottom of the login screen
3. Enter their password
4. See a dashboard showing only their location's staff — who has passed, scores, dates
5. Can add new staff members (automatically assigned to their location)
6. Can reset a staff member's quiz attempt if needed

### Owner / Admin (you)
1. Go to your Netlify URL
2. Enter PIN **6969**
3. See all locations — click tabs to switch between stores
4. See every staff member's status for every video
5. Add staff to any location
6. Reset any staff member's quiz

---

## Troubleshooting

**"Connection error" when logging in** — The Apps Script URL in the HTML is wrong or missing. Check Step 6.

**"PIN not recognised"** — Check the PIN is in the Employees sheet. If you're using PINs that start with 0 (like 0042), format the PIN column as Plain Text — otherwise Google Sheets strips the leading zeros.

**"Incorrect password" for supervisor** — The password must match exactly what's in the Supervisors tab (case-sensitive). Check for extra spaces.

**"No quiz found for this video"** — The VideoID in Quizzes doesn't exactly match the VideoID in Videos. They must be identical.

**Scores not saving after re-deploying the script** — Make sure you deployed a New Version, not just saved. Go to Apps Script → Deploy → Manage deployments → Edit → set Version to "New version" → Deploy.

**Video won't play** — Check the YouTube URL is correct and the video is Unlisted or Public (not Private).

**Supervisor sees no staff** — Make sure the employees have a LocationID that exactly matches the supervisor's LocationID in the Supervisors tab.

---

## Quick Reference

| What | Where |
|------|-------|
| Staff training website | Your Netlify URL |
| Add/edit locations | Google Sheet → Locations tab |
| Add/edit supervisors | Google Sheet → Supervisors tab |
| Add staff | Google Sheet → Employees tab, or Admin Dashboard |
| Add videos | Google Sheet → Videos tab |
| Add quiz questions | Google Sheet → Quizzes tab |
| View all progress | Log in with admin PIN 6969 |
| View location progress | Log in with supervisor password |
| Edit backend code | Apps Script (Extensions → Apps Script in Google Sheet) |

---

*Admin PIN: 6969 | Pass threshold: 85% | Built for The Peri Peri Shack*
