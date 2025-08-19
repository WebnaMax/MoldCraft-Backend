const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Настройка CORS
app.use(cors({
    origin: 'https://moldcraft.md',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ограничение размера JSON-payload
app.use(express.json({ limit: '500kb' }));

// Обработка form-data
app.use(express.urlencoded({ extended: true }));

// Проверка наличия MONGODB_URI
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Подключение к MongoDB через Mongoose
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB:', mongoose.connection.db.databaseName))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

// Подключение маршрутов
const apiRoutes = require('./routes/api');
const contentRoutes = require('./contentRoutes'); // Укажи правильный путь
app.use('/api', apiRoutes); // Маршруты для категорий и продуктов
app.use('/api/content', contentRoutes); // Маршруты для DraftEditor и EditorPage
app.use('/public', express.static('public'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));