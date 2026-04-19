# 🚀 Deploying Subject Ace to the Web

If you want to host your app online for your demo, **Render.com** is the easiest free option. Here is your 10-minute guide to going live.

## Step 1: Push to GitHub
1.  **Create a Repository**: Go to [GitHub.com](https://github.com) and create a new repository called `Subject-Ace`.
2.  **Upload Files**: Since we've added a `.gitignore`, your API keys won't be exposed. Upload all your files to this repository.

## Step 2: Create a Web Service on Render
1.  Go to [Render.com](https://dashboard.render.com/) and Sign Up/Log In.
2.  Click **"New +"** and select **"Web Service"**.
3.  Connect your GitHub account and select your `Subject-Ace` repository.

## Step 3: Configure Settings
Set these values in the Render setup screen:
-   **Name**: `subject-ace` (or any name you like)
-   **Runtime**: `Node`
-   **Build Command**: `npm install`
-   **Start Command**: `node server.js`
-   **Instance Type**: `Free`

## Step 4: Add your API Keys (CRITICAL)
Before you hit "Create", scroll down to **"Advanced"** and look for **"Environment Variables"**:
1.  Click **"Add Environment Variable"**.
2.  Key: `GEMINI_API_KEY`
3.  Value: `[Your Actual Key from .env]`
4.  Add another variable: `PORT`, value: `10000` (Render's preferred port).

## Step 5: Go Live!
1.  Click **"Create Web Service"**.
2.  Render will spend 2–3 minutes building your app.
3.  Once it says **"Live"**, you will get a URL like `https://subject-ace.onrender.com`.

---

### ⚠️ Important for your Demo:
-   **Fresh Start**: When you first visit the URL, the library will be empty. You can register a new account and upload files live during your demo to show how it works.
-   **Persistence**: Remember that on the **Free tier**, any files you upload will disappear if the server goes to "sleep" (usually after 15 mins of inactivity). For a 30-minute demo, this will be **no problem at all!**

**You are now ready for a live web presentation!** 🚀
