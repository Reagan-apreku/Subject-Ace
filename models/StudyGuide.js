const mongoose = require('mongoose');

const StudyGuideSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    flashcards: [{
        question: { type: String, required: true },
        answer: { type: String, required: true }
    }],
    quiz: [{
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StudyGuide', StudyGuideSchema);
