const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config(); // Добавляем загрузку .env

async function migrateImages() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const products = await Product.find({ images: { $exists: false } });
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