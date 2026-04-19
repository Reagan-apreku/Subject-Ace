# Subject Ace - AI Powered Study Assistant 🎓

An advanced, local-first study platform that transforms lecture materials (PDFs, Docx, PPTX) into structured summaries, quizzes, and flashcards using Google Gemini AI.

## 🚀 Setup & Installation

Follow these steps to run Subject Ace on your laptop or any other machine.

### 1. Prerequisites
Ensure you have **Node.js** installed.
- Download it here: [https://nodejs.org/](https://nodejs.org/) (Choose the "LTS" version).

### 2. Prepare the Code
- Copy this entire folder to the new laptop.
- Open your **Terminal** (Mac) or **Command Prompt** (Windows).
- Navigate to the project folder:
  ```bash
  cd path/to/Subject-Ace-Folder
  ```

### 3. Install Dependencies
Run the following command to install all necessary libraries:
```bash
npm install
```

### 4. Configure the Environment
Ensure your `.env` file is in the root directory. It should contain your Gemini API Key:
```env
PORT=3000
GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Launch the Application
Run the developer server:
```bash
npm run dev
```

### 6. Access the Dashboard
Open your web browser and go to:
**[http://localhost:3000](http://localhost:3000)**

---

## 📁 System Folders Explained
- **`data/guides/`**: This is where all your generated AI summaries and quizzes are stored as JSON files.
- **`data/users.json`**: Stores your local login credentials and hashed passwords.
- **`data/folders.json`**: Manages your course organization and folder structure.
- **`public/`**: Contains the frontend code (HTML, JS, CSS).

## 🛡️ Note on Portability
Because this is a "Local-First" application, **all your study materials are stored inside the `data/` folder.** If you want to move your library to a new laptop, simply copy the `data/` folder along with the rest of the code!

---
**Developed by:** Leslie Amoako, Newton Tommy, and Richard Opoku.
**Supervised by:** Mr. Augustus Buckman
**University:** GCTU (2026)
