import express from 'express';
import mongoose from 'mongoose';
import { connectRedis } from './config/redis.js';
import { rawBodyMiddleware } from './middlewares/rawBody.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Глобальные middleware
app.use(rawBodyMiddleware);

// Маршрутизация
app.use('/invoice', invoiceRoutes);
app.use('/webhook', webhookRoutes);

// Инициализация БД и экспорт для тестов
export const connectDB = async () => {
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/payments',
  );
  console.log('Connected to MongoDB');
};

export { app, mongoose };

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

// Запуск сервера (если файл запущен напрямую, а не через тесты)
if (isMainModule) {
  const startServer = async () => {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  };
  startServer();
}
