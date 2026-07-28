# Deploy Tally to Vercel — Step by Step

Follow these steps exactly. Even if you've never deployed an app before, this will work.

## What You Need (5 minutes to gather)

1. A GitHub account → **[Create free GitHub account](https://github.com/signup)**
2. A Vercel account → **[Sign up free on Vercel](https://vercel.com/signup)** (use your GitHub login)
3. A Google Gemini API key → **[Get free Gemini API key](https://aistudio.google.com/apikey)** (for receipt scanning)
4. A password you want to use for Tally (e.g., `MyExpensePassword123!`)

## Step 1: Create Your Copy on GitHub (2 minutes)

**What this does**: Creates your own copy of Tally in your GitHub account.

1. **Click this button to open the Tally repo**:
   
   **[🍴 Fork Tally on GitHub](https://github.com/kittinatger/tally-kittinat-gerdsri)**
   
   (Or copy & paste this link if the button doesn't work:)
   ```
   https://github.com/kittinatger/tally-kittinat-gerdsri
   ```

2. **Look at the top right of the page**
   - You'll see several buttons in a row
   - Find the button that says **"Fork"** with a fork icon
   - It's near buttons labeled "Star" and "Watch"
   - **Click on "Fork"**

3. **On the popup that appears**:
   - Click the button that says **"Create fork"**
   - It's usually in the bottom right

4. **Wait 5-10 seconds**
   - The page will change
   - You'll see "your-username/tally-kittinat-gerdsri" at the top
   - **You now have your own copy!**

## Step 2: Deploy to Vercel (5 minutes)

**What this does**: Tells Vercel to run your copy of Tally on the internet.

1. **Click this button to go to Vercel**:
   
   **[🚀 Go to Vercel Dashboard](https://vercel.com)**
   
   (Or copy & paste: `https://vercel.com`)

2. **In the top right corner**, click **"Sign in"**
   - If you see "Dashboard", skip to step 5

3. **Click "Continue with GitHub"**
   - This connects Vercel to your GitHub account
   - You may see a popup asking permission — click "Authorize"

4. **Once logged in, you'll see the Vercel dashboard**
   - Look for a button labeled **"Add New..."** or **"New Project"** (top left or center)
   - Click it

5. **On the screen that appears**:
   - You'll see your forked Tally repo listed: `your-username/tally-kittinat-gerdsri`
   - **Click "Select" next to your fork**

6. **On the next screen**:
   - Don't change anything
   - Just scroll down and click **"Deploy"**
   - This might say "Create" instead

7. **Wait 1-2 minutes**
   - You'll see "Building..." then "Deploying..."
   - When you see a green checkmark and "Congratulations!", you're done!

**Your app is now live!** You'll see a URL like:
```
https://tally-xyz123.vercel.app
```

## Step 3: Set Up Your Database (3 minutes)

**What this does**: Creates a storage location for your expenses.

1. **In Vercel dashboard, look at the left sidebar**
   - Click on **"Storage"** (it's between "Deployments" and "Settings")

2. **Click the button that says "Create Database"** or **"Add"**
   - If you see "Connect Store", that's fine too

3. **A popup will appear with options**
   - Click **"Neon"** (Neon is Vercel's database provider — it's Postgres, just hosted elsewhere)
   - You might also see "Postgres" or other options, but choose **Neon**

4. **Accept all defaults**, just click **"Create"**
   - Don't change any of the settings
   - Wait 30-60 seconds for it to create
   - You may need to authorize Neon to connect to your Vercel account

5. **You'll see your new database listed**
   - It will have a name and show "Neon" as the provider
   - You're done with this step! ✅

## Step 4: Add Your Secrets (5 minutes)

**What this does**: Tells Vercel your passwords and API keys so your app can work.

### Quick Setup (Easiest)

1. **In Vercel, go to Settings → Environment Variables**
   - Left sidebar → "Settings" → "Environment Variables"

2. **You'll see empty boxes to fill in**
   - Click in the first box labeled "Name"

3. **Add these four secrets one at a time** (follow the exact steps below)

---

### Secret 1: `GEMINI_API_KEY` (for receipt scanning)

1. **In the "Name" box**, type exactly:
   ```
   GEMINI_API_KEY
   ```

2. **In the "Value" box**, paste your Google Gemini API key
   - You got this from **[Google AI Studio](https://aistudio.google.com/apikey)** in Step 1
   - If you didn't get one yet, **[click here to get it](https://aistudio.google.com/apikey)**

3. **Click "Save"**

---

### Secret 2: `APP_PASSWORD` (your Tally login password)

1. **Click the "Add new..." button** to add another variable

2. **In the "Name" box**, type exactly:
   ```
   APP_PASSWORD
   ```

3. **In the "Value" box**, type your password
   - Examples: `MyPassword123!` or `SecureExpense2024`
   - Make it something you'll remember!

4. **Click "Save"**

---

### Secret 3: `SESSION_SECRET` (security key)

This is a random security key. Don't worry what it means, just generate it:

1. **Click the "Add new..." button** to add another variable

2. **In the "Name" box**, type exactly:
   ```
   SESSION_SECRET
   ```

3. **For the "Value", follow these steps**:
   - Open a terminal/command prompt on your computer
   - Copy and paste this command (copy it exactly):
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Press Enter
   - A long random string will appear (like `e7b4d9fccc1ade2ae...`)
   - Copy that entire string
   - Paste it in the "Value" box

4. **Click "Save"**

---

### Secret 4: `POSTGRES_URL` (database connection)

This tells Tally where to store your expenses.

1. **In Vercel left sidebar, click "Storage"** (where you created the database)

2. **Click on your Postgres database** (it's listed there)

3. **Look for a section that shows connection information**
   - Find the line that starts with `postgresql://`
   - Click the "Copy" icon next to it
   - This copies your database URL

4. **Go back to Settings → Environment Variables**

5. **Click "Add new..." to add another variable**

6. **In the "Name" box**, type exactly:
   ```
   POSTGRES_URL
   ```

7. **In the "Value" box**, paste the database URL you just copied

8. **Click "Save"**

## Step 5: Redeploy (2 minutes)

1. Go to **Deployments** (left sidebar)
2. Find your most recent deployment
3. Click the **...** menu (three dots) on the right
4. Click **Redeploy**
5. Wait 1-2 minutes for it to finish

## Step 6: Log In (1 minute)

1. Go to your app URL (e.g., `tally-xyz123.vercel.app`)
2. Enter your password (the one you set as `APP_PASSWORD`)
3. Click **Sign in**
4. **You're in!** Start adding expenses!

## Troubleshooting

### "Environment variables are not set" error
- Make sure you added all 4 variables in Vercel Settings → Environment Variables
- Make sure the names are **exactly** correct (copy-paste if unsure)
- Click **Redeploy** after adding variables

### "Can't connect to database" error
- Make sure you created the Postgres database in Vercel Storage
- Make sure `POSTGRES_URL` is set in Environment Variables
- Click **Redeploy**

### "Wrong password" on login
- You set the wrong `APP_PASSWORD` or mistyped it
- Update `APP_PASSWORD` in Environment Variables with the correct password
- Click **Redeploy**

### "Receipt scanning doesn't work"
- You need a valid Gemini API key → **[Get Gemini API Key](https://aistudio.google.com/apikey)**
- Make sure `GEMINI_API_KEY` is set correctly in Environment Variables
- Click **Redeploy**
- Manual expense entry still works without the API key

## You're Done!

Your personal expense tracker is now live and only accessible with your password.

**Next steps:**
- Add your first expense manually
- Try taking a photo of a receipt to test AI extraction
- Customize categories in Settings
- Share the URL only with people you trust

**Need help?** → **[Report issue on GitHub](https://github.com/kittinatger/tally-kittinat-gerdsri/issues)**
