require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// File Parsing Libraries
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');

// AI Library
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Local Data Layer
const db = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Gemini AI Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');
// Updated to Gemini 2.5 Flash as per your authorized model list
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper to extract text from files
async function extractText(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext === '.pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
    } else if (ext === '.pptx') {
        return new Promise((resolve, reject) => {
            officeParser.parseOffice(file.buffer, (data, err) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }
    throw new Error('Unsupported file format');
}

// Multer Setup
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.pptx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf, .docx, and .pptx files are allowed'));
        }
    }
});

// --- Authentication Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existing = await db.findUser(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = await db.saveUser(name, email, password);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await db.findUser(email);
        if (!user || !db.verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { password: _, ...userProfile } = user;
        res.json(userProfile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Existing Routes ---
app.get('/api/guides', async (req, res) => {
    try {
        const guides = await db.getAllGuides();
        res.json(guides);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/guides/:id', async (req, res) => {
    try {
        const guide = await db.getGuideById(req.params.id);
        if (!guide) return res.status(404).json({ error: 'Guide not found' });
        res.json(guide);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ask', async (req, res) => {
    try {
        const { guideId, question } = req.body;
        const guide = await db.getGuideById(guideId);
        if (!guide) return res.status(404).json({ error: 'Guide not found' });

        const context = `DOCUMENT SUMMARY:\n${guide.summary}\n\n`;
        const prompt = `You are a helpful study assistant. Answer the student's question based on the document summary provided below.\n\n${context}\n\nUSER QUESTION: ${question}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ answer: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Folder Routes
app.get('/api/folders', async (req, res) => {
    try {
        const folders = await db.getFolders();
        res.json(folders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/folders', async (req, res) => {
    try {
        const { name, parentId } = req.body;
        if (!name) return res.status(400).json({ error: 'Folder name is required' });
        const folder = await db.saveFolder(name, parentId);
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/folders/:id', async (req, res) => {
    try {
        await db.deleteFolder(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/guides/:id', async (req, res) => {
    try {
        const deleted = await db.deleteGuide(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Guide not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/guides/:id/move', async (req, res) => {
    try {
        const { folderId } = req.body;
        const updated = await db.updateGuide(req.params.id, { folderId });
        if (!updated) return res.status(404).json({ error: 'Guide not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate', upload.single('file'), async (req, res) => {
    try {
        const { folderId } = req.body; // Can be null or 'root'
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const text = await extractText(req.file);
        if (!text || text.trim().length < 50) {
            return res.status(400).json({ error: 'Extracted text is too short or empty.' });
        }

        const systemInstruction = `You are an expert tutor. Generate a study guide. Return ONLY a valid JSON object with: 'summary' (string), 'flashcards' (array of 10 objects with 'front' and 'back'), and 'quiz' (array of 5 objects with 'question', 'options' (array of 4), and 'correctAnswer').`;
        
        const prompt = `${systemInstruction}\n\nTEXT:\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiData;
        
        try {
            const cleanText = response.text().replace(/```json|```/g, '').trim();
            aiData = JSON.parse(cleanText);
        } catch (parseError) {
            return res.status(500).json({ error: 'AI response error. Please try again.' });
        }

        const savedGuide = await db.saveGuide({
            filename: req.file.originalname,
            folderId: folderId || 'root',
            summary: aiData.summary,
            flashcards: aiData.flashcards.map(c => ({ question: c.front, answer: c.back })),
            quiz: aiData.quiz
        });

        res.json(savedGuide);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server only in local/dev mode (not on Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
