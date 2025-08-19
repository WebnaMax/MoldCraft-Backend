const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

// URL подключения к MongoDB (замени на свой, например, 'mongodb://localhost:27017' или URL от MongoDB Atlas)
const mongoUri = 'mongodb+srv://MaximTurcan:IBfXupgZZ6HlcuLB@clusterbesttools.3x7seo5.mongodb.net/toolshop?retryWrites=true&w=majority';
const dbName = 'toolshop';
const collectionName = 'content'; // Имя коллекции

// Middleware для проверки пароля
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin999') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET: Получение контента
router.get('/content', authMiddleware, async (req, res) => {
    let client;
    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const doc = await collection.findOne({ contentId: 'draftEditorContent' });
        res.json({ content: doc ? doc.content : null });
    } catch (err) {
        console.error('Error fetching content from MongoDB:', err);
        res.status(500).json({ error: 'Failed to load content' });
    } finally {
        if (client) await client.close();
    }
});

// POST: Сохранение контента
router.post('/content', authMiddleware, async (req, res) => {
    let client;
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'No content provided' });
        }

        client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        await collection.updateOne(
            { contentId: 'draftEditorContent' },
            { $set: { content } },            { upsert: true }
        );
        res.json({ message: 'Content saved' });
    } catch (err) {
        console.error('Error saving content to MongoDB:', err);
        res.status(500).json({ error: 'Failed to save content' });
    } finally {
        if (client) await client.close();
    }
});

module.exports = router;