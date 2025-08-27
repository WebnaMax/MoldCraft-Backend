const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB for migration');
    const products = await Product.find({ 'images.0': { $exists: true } });

    for (const product of products) {
      const updatedImages = await Promise.all(product.images.map(async (imagePath) => {
        if (imagePath.startsWith('/public/images/')) {
          const filePath = path.join(__dirname, 'public', imagePath.replace('/public/images/', ''));
          try {
            const data = await fs.readFile(filePath);
            const result = await cloudinary.uploader.upload(filePath, {
              folder: 'tools_images',
              public_id: `migrated_tool_${Date.now()}_${path.basename(imagePath)}`
            });
            await fs.unlink(filePath);
            return result.secure_url;
          } catch (err) {
            console.error(`Error migrating ${imagePath}:`, err);
            return imagePath;
          }
        }
        return imagePath;
      }));

      await Product.findByIdAndUpdate(product._id, { images: updatedImages });
      console.log(`Migrated images for product ${product._id}`);
    }

    console.log('Migration completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error during migration:', err);
    process.exit(1);
  });
