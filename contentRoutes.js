const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

// URL подключения к MongoDB Atlas
const mongoUri = 'mongodb+srv://MaximTurcan:IBfXupgZZ6HlcuLB@clusterbesttools.3x7seo5.mongodb.net/toolshop?retryWrites=true&w=majority';
const dbName = 'toolshop';
const contentCollection = 'content';
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

// Middleware для CORS
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://moldcraft.md');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// GET: Получение контента DraftEditor
router.get('/content', authMiddleware, async (req, res) => {
    let client;
    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('Connected to MongoDB for GET /content');
        const db = client.db(dbName);
        const collection = db.collection(contentCollection);
        const doc = await collection.findOne({ contentId: 'draftEditorContent' });
        console.log('Fetched document:', doc);
        res.json({ content: doc ? doc.content : null });
    } catch (err) {
        console.error('Error fetching content from MongoDB:', err.message);
        res.status(500).json({ error: `Failed to load content: ${err.message}` });
    } finally {
        if (client) await client.close();
    }
});

// POST: Сохранение контента DraftEditor
router.post('/content', authMiddleware, async (req, res) => {
    let client;
    try {
        const { content } = req.body;
        if (!content) {
            console.warn('No content provided in POST /content');
            return res.status(400).json({ error: 'No content provided' });
        }
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('Connected to MongoDB for POST /content');
        const db = client.db(dbName);
        const collection = db.collection(contentCollection);
        await collection.updateOne(
            { contentId: 'draftEditorContent' },
            { $set: { content } },
            { upsert: true }
        );
        console.log('Saved content:', content);
        res.json({ message: 'Content saved' });
    } catch (err) {
        console.error('Error saving content to MongoDB:', err.message);
        res.status(500).json({ error: `Failed to save content: ${err.message}` });
    } finally {
        if (client) await client.close();
    }
});

// GET: Получение контента секции EditorPage
router.get('/section/:sectionKey', authMiddleware, async (req, res) => {
    let client;
    try {
        const { sectionKey } = req.params;
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log(`Connected to MongoDB for GET /section/${sectionKey}`);
        const db = client.db(dbName);
        const collection = db.collection(sectionsCollection);
        const doc = await collection.findOne({ sectionKey });
        console.log(`Fetched section ${sectionKey}:`, doc);
        res.json({ content: doc ? doc.content : null });
    } catch (err) {
        console.error(`Error fetching section ${req.params.sectionKey} from MongoDB:`, err.message);
        res.status(500).json({ error: `Failed to load section content: ${err.message}` });
    } finally {
        if (client) await client.close();
    }
});

// POST: Сохранение контента секции EditorPage
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
        console.log(`Connected to MongoDB for POST /section/${sectionKey}`);
        const db = client.db(dbName);
        const collection = db.collection(sectionsCollection);
        await collection.updateOne(
            { sectionKey },
            { $set: { content } },
            { upsert: true }
        );
        console.log(`Saved section ${sectionKey}:`, content);
        res.json({ message: 'Section content saved' });
    } catch (err) {
        console.error(`Error saving section ${req.params.sectionKey} to MongoDB:`, err.message);
        res.status(500).json({ error: `Failed to save section content: ${err.message}` });
    } finally {
        if (client) await client.close();
    }
});

module.exports = router;