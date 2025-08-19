const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  images: [{ type: String }], // Массив строк для путей к изображениям
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
});

// Индексы для производительности
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });

// Хук для автоматического расчёта originalPrice
productSchema.pre('save', function (next) {
  if (this.discount > 0 && this.price && !this.originalPrice) {
    this.originalPrice = this.price / (1 - this.discount / 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);