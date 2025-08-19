const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function migrateImages() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 2, // Ограничение пула соединений
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('Connected to MongoDB');

        const products = await Product.find({ images: { $exists: false } }).limit(100); // Ограничение количества записей
        if (products.length === 0) {
            console.log('No products to migrate');
            return;
        }

        for (const product of products) {
            product.images = ['/public/images/default.jpg']; // Замените на реальные пути
            await product.save({ validateBeforeSave: false }); // Ускорение сохранения
            console.log(`Updated product ${product._id}`);
        }

        console.log('Migration complete for this batch');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrateImages();