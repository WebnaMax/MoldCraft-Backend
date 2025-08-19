const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Определяем схемы и модели для коллекций
const contentSchema = new mongoose.Schema({
    contentId: String,
    content: Object
});
const sectionSchema = new mongoose.Schema({
    sectionKey: String,
    content: Object
});
const Content = mongoose.model('Content', contentSchema, 'content');
const Section = mongoose.model('Section', sectionSchema, 'sections');

// Middleware для проверки пароля
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin999') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET: Получение контента DraftEditor
router.get('/content', authMiddleware, async (req, res) => {
    try {
        const doc = await Content.findOne({ contentId: 'draftEditorContent' });
        console.log('Fetched document:', doc);
        res.json({ content: doc ? doc.content : null });
    } catch (err) {
        console.error('Error fetching content from MongoDB:', err);
        res.status(500).json({ error: 'Failed to load content' });
    }
});

// POST: Сохранение контента DraftEditor
router.post('/content', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'No content provided' });
        }
        await Content.updateOne(
            { contentId: 'draftEditorContent' },
            { $set: { content } },
            { upsert: true }
        );
        console.log('Saved content:', content);
        res.json({ message: 'Content saved' });
    } catch (err) {
        console.error('Error saving content to MongoDB:', err);
        res.status(500).json({ error: 'Failed to save content' });
    }
});

// GET: Получение контента секции EditorPage
router.get('/section/:sectionKey', authMiddleware, async (req, res) => {
    try {
        const { sectionKey } = req.params;
        const doc = await Section.findOne({ sectionKey });
        console.log(`Fetched section ${sectionKey}:`, doc);
        res.json({ content: doc ? doc.content : null });
    } catch (err) {
        console.error(`Error fetching section ${sectionKey} from MongoDB:`, err);
        res.status(500).json({ error: 'Failed to load section content' });
    }
});

// POST: Сохранение контента секции EditorPage
router.post('/section/:sectionKey', authMiddleware, async (req, res) => {
    try {
        const { sectionKey } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'No content provided' });
        }
        await Section.updateOne(
            { sectionKey },
            { $set: { content } },
            { upsert: true }
        );
        console.log(`Saved section ${sectionKey}:`, content);
        res.json({ message: 'Section content saved' });
    } catch (err) {
        console.error(`Error saving section ${sectionKey} to MongoDB:`, err);
        res.status(500).json({ error: 'Failed to save section content' });
    }
});

module.exports = router;