const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

// Настройка Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Настройка Multer для Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tools_images',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif'],
    public_id: (req, file) => `tool_${Date.now()}_${file.originalname}`
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  }
}).array('images', 4);

// Middleware для обработки ошибок Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`[${new Date().toISOString()}] Multer error: ${err.message}`);
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    console.error(`[${new Date().toISOString()}] File filter error: ${err.message}`);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Получение всех категорий
router.get('/categories', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching categories`);
    const categories = await Category.find().populate('parentCategory');
    res.json(categories);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching categories: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Получение всех продуктов
router.get('/products', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching products`);
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching products: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Получение продуктов по категории
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching products for category ${req.params.categoryId}`);
    const products = await Product.find({ category: req.params.categoryId }).populate('category');
    res.json(products);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching products by category: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Получение продуктов со скидкой
router.get('/products-discounted', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching discounted products`);
    const products = await Product.find({ discount: { $gt: 0 } }).populate('category');
    res.json(products);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching discounted products: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Получение продукта по ID
router.get('/products/:id', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching product with ID: ${req.params.id}`);
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in /products/:id: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Создание продукта
router.post('/products', upload, handleMulterError, async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Received files:`, req.files);
    console.log(`[${new Date().toISOString()}] Received body:`, req.body);
    const { name, shortDescription, description, price, originalPrice, discount, category } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];
    const productData = {
      name,
      shortDescription,
      description,
      price: parseFloat(price),
      originalPrice: discount > 0 ? parseFloat(originalPrice) : undefined,
      discount: parseFloat(discount) || 0,
      category,
      images
    };

    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in POST /products: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// Обновление продукта
router.put('/products/:id', upload, handleMulterError, async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Received files:`, req.files);
    console.log(`[${new Date().toISOString()}] Received body:`, req.body);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });

    const { name, shortDescription, description, price, originalPrice, discount, category } = req.body;
    const images = req.files.length > 0 ? req.files.map(file => file.path).concat(product.images.filter(img => !req.body.existingImages.includes(img))) : product.images;
    Object.assign(product, {
      name,
      shortDescription,
      description,
      price: parseFloat(price),
      originalPrice: discount > 0 ? parseFloat(originalPrice) : undefined,
      discount: parseFloat(discount) || 0,
      category,
      images
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in PUT /products/:id: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// Удаление продукта
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    if (product.images.length > 0) {
      const publicIds = product.images.map(url => {
        const match = url.match(/tools_images\/(.+?)\.(jpeg|jpg|png|gif)$/);
        return match ? `tools_images/${match[1]}` : null;
      }).filter(id => id);
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }
    }
    await product.deleteOne();
    res.json({ message: 'Товар удален' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in DELETE /products/:id: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
