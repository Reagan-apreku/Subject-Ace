const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simple unique ID generator to avoid external dependencies
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const DATA_DIR = path.join(__dirname, '../data/guides');
const FOLDER_PATH = path.join(__dirname, '../data/folders.json');
const USERS_PATH = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize folders if missing
if (!fs.existsSync(FOLDER_PATH)) {
    fs.writeFileSync(FOLDER_PATH, JSON.stringify([], null, 2));
}

// Initialize users if missing
if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify([], null, 2));
}

const db = {
    // Save a new study guide
    saveGuide: async (data) => {
        const id = generateId();
        const guide = {
            _id: id,
            folderId: data.folderId || 'root', // Link to a folder
            ...data,
            createdAt: new Date().toISOString()
        };
        const filePath = path.join(DATA_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(guide, null, 2));
        return guide;
    },

    // Update an existing guide (e.g., move to folder)
    updateGuide: async (id, data) => {
        const filePath = path.join(DATA_DIR, `${id}.json`);
        if (!fs.existsSync(filePath)) return null;
        const current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const updated = { ...current, ...data };
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
        return updated;
    },

    // Get all study guides
    getAllGuides: async () => {
        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
        const guides = files.map(file => {
            try {
                const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
                return JSON.parse(content);
            } catch (e) { return null; }
        }).filter(g => g !== null);
        // Sort by newest first
        return guides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // Folder Operations
    getFolders: async () => {
        const content = fs.readFileSync(FOLDER_PATH, 'utf-8');
        return JSON.parse(content);
    },

    saveFolder: async (name, parentId = 'root') => {
        const folders = JSON.parse(fs.readFileSync(FOLDER_PATH, 'utf-8'));
        const newFolder = {
            _id: generateId(),
            name,
            parentId
        };
        folders.push(newFolder);
        fs.writeFileSync(FOLDER_PATH, JSON.stringify(folders, null, 2));
        return newFolder;
    },

    deleteFolder: async (id) => {
        const folders = JSON.parse(fs.readFileSync(FOLDER_PATH, 'utf-8'));
        const filtered = folders.filter(f => f._id !== id);
        fs.writeFileSync(FOLDER_PATH, JSON.stringify(filtered, null, 2));
        return true;
    },

    deleteGuide: async (id) => {
        const filePath = path.join(DATA_DIR, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    },

    // Get a specific guide
    getGuideById: async (id) => {
        const filePath = path.join(DATA_DIR, `${id}.json`);
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    },

    // User Authentication
    findUser: async (email) => {
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
        return users.find(u => u.email === email);
    },

    saveUser: async (name, email, password) => {
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
        
        // Hash password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        const newUser = {
            _id: generateId(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
        
        // Don't return password
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    },

    verifyPassword: (inputPassword, storedPassword) => {
        const hashedInput = crypto.createHash('sha256').update(inputPassword).digest('hex');
        return hashedInput === storedPassword;
    }
};

module.exports = db;
