const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Создаем маршрутизатор
const router = express.Router();

// Настройка multer для сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
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
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Маршруты для категорий и продуктов
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId }).populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products-discounted', async (req, res) => {
  try {
    const products = await Product.find({ discount: { $gt: 0 } }).populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    console.log('Fetching product with ID:', req.params.id);
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error in /products/:id:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/products', upload, handleMulterError, async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);
    const { name, shortDescription, description, price, originalPrice, discount, category } = req.body;
    const images = req.files ? req.files.map(file => `/public/images/${file.filename}`) : [];
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
    console.error('Error in POST /products:', err);
    res.status(400).json({ message: err.message });
  }
});

router.put('/products/:id', upload, handleMulterError, async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });

    const { name, shortDescription, description, price, originalPrice, discount, category } = req.body;
    const images = req.files.length > 0 ? req.files.map(file => `/public/images/${file.filename}`).concat(product.images.filter(img => !req.body.existingImages.includes(img))) : product.images;
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
    console.error('Error in PUT /products/:id:', err);
    res.status(400).json({ message: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    await product.deleteOne();
    res.json({ message: 'Товар удален' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Экспортируем маршрутизатор
module.exports = router;