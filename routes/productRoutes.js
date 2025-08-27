const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tools_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `tool_${Date.now()}_${file.originalname}`
  }
});
const upload = multer({ storage: storage });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer admin999') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/', authMiddleware, upload.array('images', 4), async (req, res) => {
  try {
    const { name, shortDescription, description, price, originalPrice, discount, category } = req.body;
    const imageUrls = req.files.map(file => file.path);
    const product = new Product({
      name,
      shortDescription,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      discount: parseFloat(discount),
      images: imageUrls,
      category
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

router.put('/:id', authMiddleware, upload.array('images', 4), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortDescription, description, price, originalPrice, discount, category, existingImages } = req.body;
    const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
    const newImageUrls = req.files.map(file => file.path);
    const updatedImages = [...parsedExistingImages, ...newImageUrls];

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        shortDescription,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discount: parseFloat(discount),
        images: updatedImages,
        category
      },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.images.length > 0) {
      const publicIds = product.images.map(url => {
        const match = url.match(/tools_images\/(.+?)\.(jpg|png|jpeg)$/);
        return match ? `tools_images/${match[1]}` : null;
      }).filter(id => id);
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

module.exports = router;
