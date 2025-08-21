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

// Обработка form-data для Multer
app.use(express.urlencoded({ extended: true }));

// Проверка наличия MONGODB_URI
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('Connected to MongoDB:', mongoose.connection.db.databaseName))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Обработка ошибок Mongoose
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err.message);
});

const apiRoutes = require('./routes/api');
const contentRoutes = require('./contentRoutes');
app.use('/api', apiRoutes);
app.use('/api', contentRoutes);
app.use('/public', express.static('public')); // Для обслуживания статических файлов

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));