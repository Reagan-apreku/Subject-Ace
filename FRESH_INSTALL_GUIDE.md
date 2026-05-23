# 🚀 Subject Ace: Fresh Laptop Setup Guide

This guide will help you run **Subject Ace** on a new laptop that has nothing installed. Follow these steps in order.

---

## Step 1: Install Node.js (The Engine)
Your computer needs Node.js to run the server.
1.  Go to **[nodejs.org](https://nodejs.org/)**.
2.  Click on the button that says **"LTS"** (Recommended for most users).
3.  Download the installer, run it, and click "Next" until it finishes.
4.  **Restart your laptop** once the installation is complete.

---

## Step 2: Get the Project Folder
You can get the code in two ways:

### Option A: From GitHub (Requires Git installed)
1.  Open your **Terminal** (Mac) or **Command Prompt** (Windows).
2.  Type: `git clone https://github.com/Reagan-apreku/Subject-Ace.git`
3.  Enter the folder: `cd Subject-Ace`

### Option B: Download ZIP (No login, No Git needed)
1.  Go to [github.com/Reagan-apreku/Subject-Ace](https://github.com/Reagan-apreku/Subject-Ace).
2.  Click the green **"<> Code"** button.
3.  Click **"Download ZIP"**.
4.  Extract the ZIP folder to your Desktop.

### Option C: From a USB Drive
1.  Copy the folder from your USB to your Desktop.
2.  Open your **Terminal** and type `cd ` then drag the folder from your Desktop into the window.

---

## Step 3: Install Project Libraries
Inside your terminal (while inside the project folder), run:
```bash
npm install
```
*Wait for it to finish. This downloads all the AI and server components (Express, Gemini API, etc.).*

---

## Step 4: Setup your API Key
The AI needs a "key" to talk to Google Gemini.
1.  Look for a file named `.env.example`.
2.  Rename it to exactly **`.env`**.
3.  Open it with Notepad or TextEdit and paste your key:
    ```env
    GEMINI_API_KEY=your_actual_key_here
    PORT=3000
    ```

---

## Step 5: Launch Subject Ace
In your terminal, run the final command:
```bash
npm run dev
```

---

## Step 6: Access the App
Open your web browser (Chrome, Safari, or Edge) and go to:
### **[http://localhost:3000](http://localhost:3000)**

---

## 📁 How to move your study data?
If you want to keep your existing folders and summaries:
1.  Copy the **`data/`** folder from the old laptop.
2.  Paste it into the new project folder, replacing the empty `data/` folder.
3.  Refresh the browser, and all your files will be there!

**You are now ready to ACE your presentation!** 🎓🚀
