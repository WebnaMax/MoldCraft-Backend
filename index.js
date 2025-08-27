const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Настройка CORS
const corsOptions = {
    origin: 'https://moldcraft.md',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Обработка OPTIONS запросов
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));

// Проверка MONGODB_URI
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log(`[${new Date().toISOString()}] Connected to MongoDB: ${mongoose.connection.db.databaseName}`))
    .catch(err => {
        console.error(`[${new Date().toISOString()}] MongoDB connection error:`, err);
        process.exit(1);
    });

mongoose.connection.on('error', err => {
    console.error(`[${new Date().toISOString()}] MongoDB connection error:`, err);
});

// Подключение маршрутов
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`));