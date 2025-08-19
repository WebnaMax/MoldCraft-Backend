const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config(); // Добавляем загрузку .env

async function migrateImages() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 5,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('Connected to MongoDB');

        const products = await Product.find({ images: { $exists: false } }).limit(100); // Батч для оптимизации
        for (const product of products) {
            product.images = ['/public/images/default.jpg']; // Замените на реальные пути
            await product.save();
            console.log(`Updated product ${product._id}`);
        }

        console.log('Migration complete');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrateImages();