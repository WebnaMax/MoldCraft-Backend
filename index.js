const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Настройка CORS
app.use(cors({
    origin: 'https://moldcraft.md', // Разрешаем только ваш домен
    credentials: true, // Разрешаем куки и заголовки авторизации
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Явно указываем методы
    allowedHeaders: ['Content-Type', 'Authorization'], // Разрешаем необходимые заголовки
}));

// Обработка OPTIONS запросов
app.options('*', cors()); // Разрешаем preflight запросы для всех маршрутов

app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));

// Проверка MONGODB_URI
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Подключение к MongoDB
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
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} at ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' })}`));