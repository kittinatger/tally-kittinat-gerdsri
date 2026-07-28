# Deploy Tally to Vercel — Step by Step

Follow these steps exactly. Even if you've never deployed an app before, this will work.

## What You Need (5 minutes to gather)

1. A [GitHub](https://github.com) account (free)
2. A [Vercel](https://vercel.com) account (free, sign in with GitHub)
3. A free [Google Gemini API key](https://aistudio.google.com/apikey) (for receipt scanning)
4. A password you want to use for Tally (e.g., `MyExpensePassword123!`)

## Step 1: Create Your Copy on GitHub (2 minutes)

1. Go to [github.com/kittinatger/tally-kittinat-gerdsri](https://github.com/kittinatger/tally-kittinat-gerdsri)
2. Click the **Fork** button (top right)
   - This creates your own copy of Tally
3. Click **Create fork**
4. Wait a few seconds — you now have your own copy! ✅

## Step 2: Deploy to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign in** (top right)
3. Click **Continue with GitHub**
4. Authorize Vercel to access your GitHub account
5. On the "New Project" screen:
   - You should see your fork listed as `your-username/tally-kittinat-gerdsri`
   - Click **Select** or **Import** next to it
6. On the next screen, just click **Deploy**
   - (Don't change anything — the defaults are fine)
7. Wait 1-2 minutes for deployment to finish
8. You'll see a green **"Congratulations"** message ✅

**Your app is now live!** You'll see a URL like `tally-xyz123.vercel.app`

## Step 3: Set Up Your Database (3 minutes)

1. In Vercel, go to **Storage** (left sidebar)
2. Click **Create Database**
3. Click **Postgres**
4. Click **Create**
5. Accept the default settings and click **Create**
6. Wait for the database to be created

## Step 4: Add Your Secrets (3 minutes)

These are the passwords/keys that make your app work.

1. In Vercel, go to **Settings** (left sidebar)
2. Click **Environment Variables**
3. Add these four variables by filling in the name and value for each:

### Variable 1: `GEMINI_API_KEY`
- **Name**: `GEMINI_API_KEY` (type exactly)
- **Value**: Your Google Gemini API key (from step 1)
- Click **Save**

### Variable 2: `APP_PASSWORD`
- **Name**: `APP_PASSWORD` (type exactly)
- **Value**: Your Tally password (e.g., `MyExpensePassword123!`)
- Click **Save**

### Variable 3: `SESSION_SECRET`
- **Name**: `SESSION_SECRET` (type exactly)
- **Value**: Open a terminal and paste this command:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - Press Enter
  - Copy the long random string it prints
  - Paste it as the value
- Click **Save**

### Variable 4: `POSTGRES_URL`
- Go back to **Storage** (left sidebar)
- Click on your Postgres database
- Scroll down and copy the `.env.local` text
- Go back to **Settings → Environment Variables**
- **Name**: `POSTGRES_URL` (type exactly)
- **Value**: Paste the connection string from your database (it looks like `postgresql://...`)
- Click **Save**

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
4. **You're in!** ✅ Start adding expenses!

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
- You need a valid Gemini API key from https://aistudio.google.com/apikey
- Make sure `GEMINI_API_KEY` is set correctly in Environment Variables
- Click **Redeploy**
- Manual expense entry still works without the API key

## You're Done! 🎉

Your personal expense tracker is now live and only accessible with your password.

**Next steps:**
- Add your first expense manually
- Try taking a photo of a receipt to test AI extraction
- Customize categories in Settings
- Share the URL only with people you trust

**Need help?** Open an issue on [GitHub](https://github.com/kittinatger/tally-kittinat-gerdsri/issues)
