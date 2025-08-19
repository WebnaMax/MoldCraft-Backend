const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Настройка CORS
app.use(cors({
    origin: 'https://moldcraft.md/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ограничение размера JSON-payload
app.use(express.json({ limit: '10kb' }));

// Проверка наличия MONGODB_URI
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Подключение к MongoDB с оптимизированным пулом
mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
}).then(() => {
    console.log('Connected to MongoDB:', mongoose.connection.db.databaseName);
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Обработка ошибок Mongoose
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

// Подключение маршрутов
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Обслуживание статических файлов
app.use('/public', express.static('public', {
    maxAge: '1d',
    etag: false
}));

// Отключение ненужных функций
app.set('etag', false);
app.disable('x-powered-by');

// Логирование IP
const https = require('https');
https.get('https://api.ipify.org?format=json', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const ip = JSON.parse(data).ip;
        console.log('Public IP of Render instance:', ip);
    });
}).on('error', (err) => console.error('IP Error:', err));

// Порт
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));