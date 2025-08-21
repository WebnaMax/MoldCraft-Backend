const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

// URL подключения к MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://MaximTurcan:IBfXupgZZ6HlcuLB@clusterbesttools.3x7seo5.mongodb.net/toolshop?retryWrites=true&w=majority';
const dbName = 'toolshop';
const sectionsCollection = 'sections';

// Middleware для проверки пароля
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin999') {
        console.warn('Unauthorized access attempt', { authHeader });
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing Authorization header' });
    }
    next();
};

// Middleware для CORS и предотвращения кэширования
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://moldcraft.md');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Cache-Control');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    if (req.method === 'OPTIONS') {
        console.log(`Handling OPTIONS request for ${req.url}`);
        return res.sendStatus(200);
    }
    next();
});

// GET: Получение контента секции
router.get('/section/:sectionKey', authMiddleware, async (req, res) => {
    let client;
    try {
        const { sectionKey } = req.params;
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log(`Connected to MongoDB for GET /section/${sectionKey} at ${new Date().toISOString()}`);
        const db = client.db(dbName);
        const collection = db.collection(sectionsCollection);
        const doc = await collection.findOne({ sectionKey });
        console.log(`Fetched section ${sectionKey} from MongoDB:`, doc);
        if (!doc) {
            console.warn(`No document found for sectionKey: ${sectionKey}`);
            return res.status(404).json({ message: 'Section not found' });
        }
        res.json({ content: doc.content });
    } catch (err) {
        console.error(`Error fetching section ${req.params.sectionKey} from MongoDB:`, err.message);
        res.status(500).json({ error: `Failed to load section content: ${err.message}` });
    } finally {
        if (client) await client.close();
    }
});

// POST: Сохранение контента секции
router.post('/section/:sectionKey', authMiddleware, async (req, res) => {
    let client;
    try {
        const { sectionKey } = req.params;
        const { content } = req.body;
        if (!content) {
            console.warn(`No content provided for section ${sectionKey}`);
            return res.status(400).json({ error: 'No content provided' });
        }
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log(`Connected to MongoDB for POST /section/${sectionKey} at ${new Date().toISOString()}`);
        const db = client.db(dbName);
        const collection = db.collection(sectionsCollection);
        const existingDoc = await collection.findOne({ sectionKey });
        console.log(`Existing document for ${sectionKey}:`, existingDoc);
        const result = await collection.updateOne(
            { sectionKey },
            { $set: { content, updatedAt: new Date() } },
            { upsert: true }
        );
        console.log(`Update result for section ${sectionKey}:`, { content, result });
        if (result.matchedCount === 0 && result.upsertedCount === 0) {
            console.error(`No document updated or inserted for sectionKey: ${sectionKey}`);
            return res.status(500).json({ error: `Failed to update or insert document for ${sectionKey}` });
        }
        res.json({ message: 'Section content saved' });
    } catch (err) {
        console.error(`Error saving section ${req.params.sectionKey} to MongoDB:`, err.message);
        res.status(500).json({ error: `Failed to save section content: ${err.message}` });
    } finally {
        if (client) await client.close();
    }
});

module.exports = router;